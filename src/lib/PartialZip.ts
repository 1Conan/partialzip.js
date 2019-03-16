import fetch from 'node-fetch';
import { inflateRawSync } from 'zlib';

import { IHeader } from '../interfaces/Header';
import { IFileInfo } from '../interfaces/FileInfo';
import { IEoCD } from '../interfaces/EoCD';
import { ILocalFileInfo } from '../interfaces/LocalFileInfo';

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

  /**
   * Fetches all data needed to get the file list
   */
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
    await this.getCentralDirectory(eocd.cdOffset, eocd.cdOffset + eocd.cdSize);
  }

  /**
   * Download the specific file
   * @param file - File info from pz.files
   */
  public async get(file: IFileInfo) {
    if (file.fileName.endsWith('/')) throw new Error('Cannot download directories');
    if (![0, 8].includes(file.compressionMethod)) throw new Error('Compression method not support');

    const localFileHeaderSize = 30 + file.fileNameLength + file.extraFieldLength;
    const data = await PartialZip
      .partialGet(this.url, file.offset, file.offset + file.compressedSize + localFileHeaderSize);

    const fileData = data.slice(localFileHeaderSize);

    switch (file.compressionMethod) {
      case 8:
        return await this.inflate(fileData);
      default:
        return fileData;
    }
  }

  /**
   * Downloads the central directory of the zip
   */
  private async getCentralDirectory(start: number, end: number) {
    const data = await PartialZip.partialGet(this.url, start, end, this.headers);
    const files = this.splitBuffer(data, Buffer.from('\x50\x4b\x01\x02'));
    for (const file of files) {
      try {
        const parsed = PartialZip.parseCentralDirectoryEntry(file);
        this.files.set(parsed.fileName, parsed);
      } catch (e) {}
    }
  }

  /**
   * Downloads the End of Central Directory
   */
  private async getEndOfCentralDirectory() {
    /**
     * 22 - EoCD without comment
     * 0xffff - Max EoCD comment size
     */
    const bufferSize = Math.min(22 + 0xffff, this.contentLength);
    const bufferReadStart =  this.contentLength - bufferSize;

    const eocdTempBuffer = await PartialZip.partialGet(
      this.url,
      bufferReadStart,
      this.contentLength - 1,
      this.headers);

    const parsedEocd = PartialZip.parseEndOfCentralDirectory(eocdTempBuffer);

    return parsedEocd;
  }

  /**
   * Parses Local File header
   * @param buf - Local File Header
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
      extraField: buf.slice(30 + fileHeader.fileNameLength),
    };
  }

  /**
   * Parses an entry in the Central Directory
   * @param buf - Central Directory Entry
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
    const extraField = fileData
      .slice(fileInfo.fileNameLength, fileInfo.fileNameLength + fileInfo.extraFieldLength);
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
   * @param buf - EOCD Buffer
   */
  public static parseEndOfCentralDirectory(buf: Buffer): IEoCD {
    let eocdBuffer: Buffer | undefined;

    for (let i = buf.length - 22; i >= 0; i -= 1) {
      if (buf.readUInt32LE(i) !== 0x06054b50) continue;
      eocdBuffer = buf.slice(i);
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

  /**
   * Partially downloads files
   * @param url - File URL
   * @param start - Byte where the download starts.
   * @param end - Byte where the download ends.
   * @param headers - Request Headers
   */
  public static async partialGet(url: string, start: number, end: number, headers: IHeader = {}) {
    const req = await fetch(url, {
      headers: { ...headers, Range: `bytes=${start}-${end}` },
    });
    return req.buffer();
  }

  private splitBuffer(buf: Buffer, buf2: Buffer, index: number = 0) {
    const results: Buffer[] = [];
    for (let i = index; i !== -1;) {
      const start = buf.indexOf(buf2, i);
      const end = buf.indexOf(buf2, i + 1);
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
    })
  }
}
