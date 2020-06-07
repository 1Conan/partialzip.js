import { bufferSplit, inflate } from '../../util/index';
import CentralDirectoryEntry from '../headers/CDEntry';
import EOCD from '../headers/EOCD';
import LocalFile from '../headers/LocalFile';

export default abstract class Zip {
  /**  Path/URL of Zip file */
  protected path: string;

  /** Zip size */
  protected size: number = -1;

  /** EOCD */
  public eocd?: EOCD;

  /** Central Directory Entries */
  public files: Map<string, CentralDirectoryEntry> = new Map();

  constructor(pathOrUrl: string) {
    this.path = pathOrUrl;
  }

  /**
   * Downloads part of a file from a url.
   *
   * @param start - start byte offset to get
   * @param end - end byte offset to get
   */
  public abstract async partialGet(start: number | bigint, end: number | bigint): Promise<Buffer>;

  /**
   * Any initialization needed like checking for partial download support
   * and file size initialization.
   * */
  protected abstract async preInit(): Promise<void>;

  /**  */
  public async init() {
    await this.preInit();
    await this.getEocd();
    await this.getCentralDir();
  }

  public async get(entry: CentralDirectoryEntry, checkIntegrity = false) {
    if (entry.fileName.endsWith('/')) throw new Error('Downloading directories isnt supported');

    const headerSize = 30 + entry.fileNameLength + entry.extraFieldLength;

    const zip64Constant = BigInt(0xffffffff);

    // Use bigints to only deal with a single type
    let offset = BigInt(entry.offset);
    let size = BigInt(entry.compressedSize);
    let uncompressedSize = BigInt(entry.uncompressedSize);

    if (
      offset === zip64Constant
      && entry.extraField.zip64
      && entry.extraField.zip64.offset > BigInt(-1)
    ) {
      offset = entry.extraField.zip64.offset;
    }

    if (
      size === zip64Constant
      && entry.extraField.zip64
      && entry.extraField.zip64.compressedSize > BigInt(-1)
    ) {
      size = entry.extraField.zip64.compressedSize;
    }

    if (
      uncompressedSize === zip64Constant
      && entry.extraField.zip64
      && entry.extraField.zip64.uncompressedSize > BigInt(-1)
    ) {
      uncompressedSize = entry.extraField.zip64.uncompressedSize;
    }

    // get extra 0xfff bytes to take account mismatch in extrafield lengths
    const data = await this.partialGet(offset, offset + size + BigInt(headerSize) + BigInt(0xfff));

    // 0xff more bytes because extrafield length mismatch
    const header = new LocalFile(data.slice(0, headerSize + 0xff));

    const fileData = data.slice(
      30 + header.extraFieldLength + header.fileNameLength,
      // Use the compressed size from the CD entry so I dont need to deal
      // with the data descriptor stuff
      30 + header.extraFieldLength + header.fileNameLength + Number(size),
    );

    if (BigInt(fileData.length) !== size) throw new Error('Invalid Compressed File Length');

    let uncompressedData: Buffer;

    if (entry.compression === 8) {
      uncompressedData = await inflate(fileData);
    } else if (entry.compression === 0) {
      uncompressedData = fileData;
    } else {
      throw new Error('Unsupported compression method');
    }

    if (BigInt(uncompressedData.length) !== uncompressedSize) {
      throw new Error('Invalid Uncompressed File Length');
    }

    if (checkIntegrity) {
      // TODO: check Integrity before returning data;
    }

    return uncompressedData;
  }

  /** */
  protected async getEocd() {
    const bufSize = Math.min(22 + 0xffff, this.size);
    const data = await this.partialGet(this.size - bufSize, this.size);
    this.eocd = new EOCD(data);
  }

  /** */
  protected async getCentralDir() {
    const data = await this.partialGet(
      this.eocd!.cdOffset,
      this.eocd!.cdOffset + this.eocd!.cdSize,
    );

    const signature = Buffer.alloc(4);
    signature.writeUInt32LE(CentralDirectoryEntry.signature, 0);

    const pieces = bufferSplit(data, signature);

    pieces.forEach((piece) => {
      const entry = new CentralDirectoryEntry(piece);
      this.files.set(entry.fileName, entry);
    });
  }
}
