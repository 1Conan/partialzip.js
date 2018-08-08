import request from 'superagent'; // tslint:disable-line:import-name
import zlib from 'zlib';

export default class {
  public fileCount: number;
  public files: any;

  private url: string;
  private length: number;
  private cdRange: ICDRange;
  private headers: IHeader;

  constructor(options: IOptions) {
    this.url = options.url;
    this.headers = options.headers === undefined ? {} : options.headers;
    this.length = 0;
    this.fileCount = 0;
    this.cdRange = {
      end: 0,
      start: 0,
    };
  }

  public async init() {
    const res = await request.head(this.url).set(this.headers);

    if (res.status > 400) {
      throw new Error(`HTTP Error: ${res.status}`);
    }

    const acceptRanges = res.header['accept-ranges'];
    const contentLength = res.header['content-length'];
    if (contentLength === null) {
      throw new Error('Content Length is null');
    }
    if (acceptRanges === null || !acceptRanges.match(/byte/i)) {
      throw new Error(`Server doesn't support partial downloads`);
    }

    this.length = parseInt(contentLength, 10);

    const eocdData = await this.getEocd();

    this.files = await this.getCd(eocdData.cdOffset, eocdData.cdOffset + eocdData.cdSize - 1);
  }

  public list(): string[] {
    return Array.from(this.files.keys());
  }

  public async get(obj: IFileData): Promise<Buffer> {
    if (obj.fileName.endsWith('/')) throw new Error(`Can't fetch base directories!`);

    const data = await this.partialGet(obj.offset, obj.offset + 512);
    const signature = data.readUInt32LE(0);

    if (signature !== 0x04034b50) throw new Error('Invalid Local File Signature');

    const compressionMethod = data.readUInt16LE(8);
    const fileNameLength = data.readUInt16LE(26);
    const extraFieldLength = data.readUInt16LE(28);
    const localFileHeaderEnd = 30 + fileNameLength + extraFieldLength;
    const newData = await this
      .partialGet(obj.offset + localFileHeaderEnd,
                  obj.offset + obj.compressedSize + localFileHeaderEnd - 1);

    if (compressionMethod === 0) {
      return newData;
    }
    if (compressionMethod === 8) {
      return zlib.inflateRawSync(newData);
    }
    throw new Error('Compression method not supported');
  }

  private async getCd(start: number, end: number): Promise<Map<string, IFileData>> {
    const parsedFiles = new Map();
    const data = await this.partialGet(start, end);

    const files = bufferSplit(data, Buffer.from('\x50\x4b\x01\x02'));

    this.fileCount = files.length;

    for (const file of files) {
      const fileInfo = {
        signature: file.readUInt32LE(0),
        version: file.readUInt16LE(4),
        versionNeededToExtract: file.readUInt16LE(6),
        flags: file.readUInt16LE(8), // tslint:disable-line
        compressionMethod: file.readUInt16LE(10),
        lastModTime: file.readUInt16LE(12),
        lastModDate: file.readUInt16LE(14),
        crc32: file.readUInt32LE(16),
        compressedSize: file.readUInt32LE(20),
        uncompressedSize: file.readUInt32LE(24),
        fileNameLength: file.readUInt16LE(28),
        extraFieldLength: file.readUInt16LE(30),
        fileCommentLength: file.readUInt16LE(32),
        diskNo: file.readUInt16LE(34),
        internalAttributes: file.readUInt16LE(36),
        externalAttributes: file.readUInt32LE(38),
        offset: file.readUInt32LE(42),
      };
      const fileDataBuf = file.slice(46);
      const fileData = {
        fileName: fileDataBuf.slice(0, fileInfo.fileNameLength).toString(),
      };
      parsedFiles.set(fileData.fileName, Object.assign(fileInfo, fileData));
    }

    return parsedFiles;
  }

  private async getEocd() {
    const eocdrWithoutCommentSize = 22;
    const maxCommentSize = 0xffff;
    const bufferSize = Math.min(eocdrWithoutCommentSize + maxCommentSize, this.length);
    const bufferReadStart =  this.length - bufferSize;

    const eocdTempBuffer = await this.partialGet(bufferReadStart, this.length - 1);
    let eocdBuffer;
    for (let i = eocdTempBuffer.length - 22; i >= 0; i -= 1) {
      if (eocdTempBuffer.readUInt32LE(i) !== 0x06054b50) continue;
      eocdBuffer = eocdTempBuffer.slice(i);
    }
    if (eocdBuffer === undefined) throw new Error('Cannot find End of Central Directory');
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

  private async partialGet(start: number, end: number): Promise<Buffer> {
    const res = await request.get(this.url)
      .set(this.headers)
      .responseType('arraybuffer')
      .set('Range', `bytes=${start}-${end}`);
    return Buffer.from(res.body);
  }

}

function bufferSplit(buffer: Buffer, buffer2: Buffer, index: number = 0): Buffer[] {
  const results: Buffer[] = [];
  let i = index;
  do {
    const start = buffer.indexOf(buffer2, i);
    const end = buffer.indexOf(buffer2, i + 1);
    results.push(buffer.slice(start, end));
    i = end;
  } while (i !== -1);
  return results;
}

interface IFileData {
  signature: number;
  version: number;
  versionNeededToExtract: number;
  flags: number;
  compressionMethod: number;
  lastModTime: number;
  lastModDate: number;
  crc32: number;
  compressedSize: number;
  uncompressedSize: number;
  fileNameLength: number;
  extraFieldLength: number;
  fileCommentLength: number;
  diskNo: number;
  internalAttributes: number;
  externalAttributes: number;
  offset: number;
  fileName: string;
}

interface IOptions {
  url: string;
  headers?: IHeader;
}

interface IHeader {
  [k: string]: string;
}

interface ICDRange {
  start: number;
  end: number;
}
