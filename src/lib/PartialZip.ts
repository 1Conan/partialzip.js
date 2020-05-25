// I used require because that fixes webpack build
// Yeah, I know it sucks.
import Fetch from 'cross-fetch';
/** @hidden */
const fetch: typeof Fetch = require('cross-fetch');
import { inflateRaw } from 'zlib';

import { IHeader } from '../interfaces/Header';
import { IFileInfo } from '../interfaces/FileInfo';
import { IEoCD } from '../interfaces/EoCD';
import { ILocalFileInfo } from '../interfaces/LocalFileInfo';
import { stringify } from 'querystring';

// Shim for nodejs 10/11
// from https://github.com/nodejs/node/blob/master/lib/internal/buffer.js
if (!Buffer.prototype.readBigUInt64LE)  {
  // tslint:disable: no-increment-decrement no-parameter-reassignment
  Buffer.prototype.readBigUInt64LE = function readBigUInt64LE(offset = 0) {
    const first = this[offset];
    const last = this[offset + 7];
    if (first === undefined || last === undefined) {
      throw new Error('Out of bounds');
    }
    const lo = first +
      this[++offset] * 2 ** 8 +
      this[++offset] * 2 ** 16 +
      this[++offset] * 2 ** 24;
    const hi = this[++offset] +
      this[++offset] * 2 ** 8 +
      this[++offset] * 2 ** 16 +
      last * 2 ** 24;
    return BigInt(lo) + (BigInt(hi) << 32n);
  };
  // tslint:enable: no-increment-decrement no-parameter-reassignment
}

/**
 * PartialZip Class
 * @example
 * ```js
 * const pz = new PartialZip({url: ''});
 * await pz.init();
 * const file = pz.get(pz.files.get('filename.ext'));
 * ```
 */
export class PartialZip {
  /** @hidden */
  private url: string;
  /** @hidden */
  private headers: IHeader;
  /** @hidden */
  private contentLength: number = 0;

  /** Compresson Methods Supported */
  public static compressionMethods = [
    /* Uncompressed */
    0,
    /* Deflate */
    8,
  ];

  /** List of parsed files from the Zip file */
  public files: Map<string, IFileInfo> = new Map();

  constructor(opt: {
    /** Zip file URL */
    url: string,
    /** Additional Headers */
    headers?: IHeader,
  }) {
    this.url = opt.url;
    this.headers = opt.headers ? opt.headers : {};
  }

  /** Fetches all data needed to get the file list */
  public async init() {
    const req = await fetch(this.url, {
      method: 'HEAD',
      headers: this.headers,
    });

    if (req.status > 400) {
      throw new Error(`HTTP Error ${req.status} ${req.statusText}`);
    }

    const acceptRanges = req.headers.get('accept-ranges');
    if (acceptRanges === null || !acceptRanges.match(/byte/i)) {
      throw new Error('Server does not support partial downloads');
    }

    const contentLength = req.headers.get('content-length');
    if (contentLength === null) {
      throw new Error('Content-Length is null');
    }
    this.contentLength = parseInt(contentLength, 10);

    const eocd = await this.getEndOfCentralDirectory();
    await this.getCentralDirectory(eocd.cdOffset, BigInt(eocd.cdOffset) + BigInt(eocd.cdSize));
  }

  /**
   * Download the specific file
   * @param file - File info from pz.files
   */
  public async get(file: IFileInfo) {
    if (file.fileName.endsWith('/')) throw new Error('Cannot download directories');
    if (!PartialZip.compressionMethods.includes(file.compressionMethod)) {
      throw new Error('Compression method not support');
    }

    const localFileHeaderSize = 30 + file.fileNameLength + file.extraFieldLength;

    let offset: number | BigInt = file.offset;
    let compressedSize: number | BigInt = file.compressedSize;

    if (offset === 0xffffffff && file.extraField.Zip64 && file.extraField.Zip64.offset) {
      offset = file.extraField.Zip64.offset;
    }
    if (compressedSize === 0xffffffff
      && file.extraField.Zip64 && file.extraField.Zip64.compressedSize) {
      compressedSize = file.extraField.Zip64.compressedSize;
    }
    const data = await PartialZip.partialGet(
      this.url,
      offset, BigInt(offset) + BigInt(compressedSize) + BigInt(localFileHeaderSize));

    const localFileHeader = PartialZip.parseLocalFileHeader(data.slice(0, localFileHeaderSize));
    const fileData = data
      .slice(30 + localFileHeader.extraFieldLength + localFileHeader.fileNameLength);

    switch (file.compressionMethod) {
      case 8:
        return await this.inflate(fileData);
      default:
        return fileData;
    }
  }

  /**
   * Downloads the central directory of the zip
   * @param start - Start of the central directory
   * @param end - End of the central directory
   */
  private async getCentralDirectory(start: number | BigInt, end: number | BigInt) {
    const data = await PartialZip.partialGet(
      this.url, start, end, this.headers);
    const files = this.splitBuffer(data, Buffer.from('\x50\x4b\x01\x02'));
    for (const file of files) {
      try {
        const parsed = PartialZip.parseCentralDirectoryEntry(file);
        this.files.set(parsed.fileName, parsed);
      } catch (e) {}
    }
  }

  /** Downloads the End of Central Directory */
  private async getEndOfCentralDirectory() {
    /**
     * 22 - EoCD without comment
     * 0xffff - Max EoCD comment size
     */
    const bufferSize = Math.min(22 + 0xffff + 0xffff, this.contentLength);
    const bufferReadStart =  this.contentLength - bufferSize;

    const eocdTempBuffer = await PartialZip.partialGet(
      this.url,
      bufferReadStart,
      this.contentLength - 1,
      this.headers);

    const parsedEocd = PartialZip.parseEndOfCentralDirectory(eocdTempBuffer);

    if (parsedEocd.cdOffset === 0xffffffff) {
      const zip64Eocd = PartialZip.parseZip64EndOfCentralDirectory(eocdTempBuffer);
      parsedEocd.cdOffset = zip64Eocd.cdOffset;
    }

    return parsedEocd;
  }

  /**
   * Parses Local File header
   * @param buf - Raw Local File Header
   */
  public static parseLocalFileHeader(buf: Buffer): ILocalFileInfo {
    if (buf.readUInt32LE(0) !== 0x04034b50) throw new Error('Invalid Local File Header');
    const fileHeader =  {
      signature: buf.readUInt32LE(0),
      versionNeededToExtract: buf.readUInt16LE(4),
      flags: buf.readUInt16LE(6),
      compressionMethod: buf.readUInt16LE(8),
      lastModTime: buf.readUInt16LE(10),
      lastModDate: buf.readUInt16LE(12),
      crc32: buf.readUInt32LE(14),
      compressedSize: buf.readUInt32LE(18),
      uncompressedSize: buf.readUInt32LE(22),
      fileNameLength: buf.readUInt16LE(26),
      extraFieldLength: buf.readInt16LE(28),
    };
    return {
      ...fileHeader,
      fileName: buf.slice(30, 30 + fileHeader.fileNameLength).toString(),
      extraField: buf.slice(
        30 + fileHeader.fileNameLength,
        30 + fileHeader.fileNameLength + fileHeader.extraFieldLength),
    };
  }

  /**
   * Parses an entry in the Central Directory
   * @param buf - Raw CD entry
   */
  public static parseCentralDirectoryEntry(buf: Buffer): IFileInfo {
    if (buf.readUInt32LE(0) !== 0x02014b50) throw new Error('Invalid Central Directory Entry');

    const fileInfo = {
      signature: buf.readUInt32LE(0),
      version: buf.readUInt16LE(4),
      versionNeededToExtract: buf.readUInt16LE(6),
      flags: buf.readUInt16LE(8),
      compressionMethod: buf.readUInt16LE(10),
      lastModTime: buf.readUInt16LE(12),
      lastModDate: buf.readUInt16LE(14),
      crc32: buf.readUInt32LE(16),
      compressedSize: buf.readUInt32LE(20),
      uncompressedSize: buf.readUInt32LE(24),
      fileNameLength: buf.readUInt16LE(28),
      extraFieldLength: buf.readUInt16LE(30),
      fileCommentLength: buf.readUInt16LE(32),
      diskNo: buf.readUInt16LE(34),
      internalAttributes: buf.readUInt16LE(36),
      externalAttributes: buf.readUInt32LE(38),
      offset: buf.readUInt32LE(42),
    };
    const fileData = buf.slice(46);
    const extraField = PartialZip.parseExtraField(
      fileData.slice(fileInfo.fileNameLength, fileInfo.fileNameLength + fileInfo.extraFieldLength),
      fileInfo);
    const fileComment = buf
      .slice(extraField.length, extraField.length + fileInfo.fileCommentLength).toString();

    return {
      ...fileInfo,
      extraField,
      fileComment,
      fileName: fileData.slice(0, fileInfo.fileNameLength).toString(),
    };
  }

  /**
   * Parses the End of Central Directory
   * @param buf - Raw EoCD
   */
  public static parseEndOfCentralDirectory(buf: Buffer): IEoCD {
    let eocdBuffer: Buffer | undefined;

    for (let i = buf.length - 22; i >= 0; i -= 1) {
      if (buf.readUInt32LE(i) !== 0x06054b50) continue;
      eocdBuffer = buf.slice(i);
      break;
    }

    if (eocdBuffer === undefined) throw new Error('Cannot find end of central directory');
    return {
      signature: eocdBuffer.readUInt32LE(0),
      diskNumber: eocdBuffer.readUInt16LE(4), // tslint:disable-line
      cdStart: eocdBuffer.readUInt16LE(6),
      cdTotal: eocdBuffer.readUInt16LE(8),
      cdEntries: eocdBuffer.readUInt16LE(10),
      cdSize: eocdBuffer.readUInt32LE(12),
      cdOffset: eocdBuffer.readUInt32LE(16),
      commentLength: eocdBuffer.readUInt16LE(20),
      comment: eocdBuffer.slice(22),
    };
  }

  public static parseZip64EndOfCentralDirectory(buf: Buffer) {
    let eocdBuffer: Buffer | undefined;

    for (let i = buf.length - 22; i >= 0; i -= 1) {
      if (buf.readUInt32LE(i) !== 0x6064b50) continue;
      eocdBuffer = buf.slice(i);
      break;
    }

    if (eocdBuffer === undefined) throw new Error('Cannot find Zip64 end of central directory');

    return {
      signature: eocdBuffer.readUInt32LE(0), // 4
      eocdSize: eocdBuffer.readBigUInt64LE(4), // 8
      versionMadeBy: eocdBuffer.readUInt16LE(12), // 2
      versionNeededToExtract: eocdBuffer.readUInt16LE(14), // 2
      diskNumber: eocdBuffer.readUInt32LE(16), // 4
      cdStart: eocdBuffer.readUInt32LE(20), // 4
      cdDiskEntries: eocdBuffer.readBigUInt64LE(24), // 8
      cdEntries: eocdBuffer.readBigUInt64LE(32), // 8
      cdSize: eocdBuffer.readBigUInt64LE(40), // 8
      cdOffset: eocdBuffer.readBigUInt64LE(48), // 8
    };
  }

  public static parseZip64EndOfCentralDirectoryLocator(buf: Buffer) {
    let eocdLocatorBuffer: Buffer | undefined;

    for (let i = buf.length - 22; i >= 0; i -= 1) {
      if (buf.readUInt32LE(i) !== 0x7064b50) continue;
      eocdLocatorBuffer = buf.slice(i);
    }

    if (eocdLocatorBuffer === undefined) throw new Error('Cannot find Zip64 end of central directory locator');
    return {
      signature: eocdLocatorBuffer.readUInt32LE(0),
      diskNumber: eocdLocatorBuffer.readUInt32LE(4),
      zip64EocdOffset: eocdLocatorBuffer.readBigUInt64LE(8),
      totalDisks: eocdLocatorBuffer.readUInt32LE(12),
    };
  }

  public static parseExtraField(buf: Buffer, fileInfo: any) {
    const fields: any = {};
    for (let i = 0; i < buf.length; i += 1) {
      let offset = i;
      const header = buf.readUInt16LE(offset);
      offset += 2;
      const size = buf.readUInt16LE(offset);
      offset += 2;

      let length = size;
      if (header === 0x0001) {
        const zip64Fields: any = {};
        if (length >= 8 && fileInfo.uncompressedSize === 0xffffffff) {
          zip64Fields.uncompressedSize = buf.readBigUInt64LE(offset);
          offset += 8;
          length -= 8;
        }
        if (length >= 8 && fileInfo.compressedSize === 0xffffffff) {
          zip64Fields.compressedSize = buf.readBigUInt64LE(offset);
          offset += 8;
          length -= 8;
        }
        if (length >= 8 && fileInfo.offset === 0xffffffff) {
          zip64Fields.offset = buf.readBigUInt64LE(offset);
          offset += 8;
          length -= 8;
        }
        fields.Zip64 = zip64Fields;
      }
      i = offset;
    }
    return fields;
  }

  /**
   * Partially downloads files
   * @param url - File URL
   * @param start - Byte where the download starts.
   * @param end - Byte where the download ends.
   * @param headers - Request Headers
   */
  public static async partialGet(
      url: string, start: number | BigInt, end: number | BigInt, headers: IHeader = {}) {
    const req = await fetch(url, {
      headers: { ...headers, Range: `bytes=${start}-${end}` },
    });
    return Buffer.from(await req.arrayBuffer());
  }

  /**
   * Split buffers by another buffer
   * @param buf - Buffer to be split
   * @param separator - The buffer used as a separator
   * @param index - Where to start spliting in {buf}
   */
  private splitBuffer(buf: Buffer, separator: Buffer, index: number = 0) {
    const results: Buffer[] = [];
    for (let i = index; i !== -1;) {
      const start = buf.indexOf(separator, i);
      const end = buf.indexOf(separator, i + 1);
      results.push(buf.slice(start, end));
      i = end;
    }
    return results;
  }

  /**
   * Promise wrapper for zlib.inflateRaw
   * @param buf - Compressed Data
   */
  private inflate(buf: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      inflateRaw(buf, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });
  }
}
