import Base from '../base/Base';

export default class EOCD64 extends Base {
  /** Zip64 EOCD signature */
  public static signature = 0x06064b50;

  /** Zip64 EOCD size */
  public size: bigint;

  /** Version */
  public version: number;

  /** Version needed to extract (minimum) */
  public versionToExtract: number;

  /** Number of this disk */
  public diskNo: number;

  /** Disk where central directory starts */
  public cdStart: number;

  /** Total number of central directory records */
  public cdTotal: bigint;

  /** Number of central directory records on this disk */
  public cdEntries: bigint;

  /** Size of central directory (bytes) */
  public cdSize: bigint;

  /** Offset of start of central directory, relative to start of archive */
  public cdOffset: bigint;

  /** Zip64 extensible data sector */
  public extensibleDataSector: Buffer;

  constructor(buf: Buffer) {
    const eocd = EOCD64.find(buf);
    if (!eocd) throw new Error('Zip64 EOCD not found');
    super(eocd);

    this.size = this.raw.readBigUInt64LE(4);

    // limit buffer to actual size

    this.version = this.raw.readUInt16LE(12);

    this.versionToExtract = this.raw.readUInt16LE(14);

    this.diskNo = this.raw.readUInt32LE(16);

    this.cdStart = this.raw.readUInt32LE(20);

    this.cdEntries = this.raw.readBigUInt64LE(24);

    this.cdTotal = this.raw.readBigUInt64LE(32);

    this.cdSize = this.raw.readBigUInt64LE(40);

    this.cdOffset = this.raw.readBigUInt64LE(48);

    this.extensibleDataSector = this.raw.slice(56, Number(this.size));
  }

  public static find(buf: Buffer) {
    // eslint-disable-next-line no-plusplus
    for (let i = buf.length - 22; i >= 0; i--) {
      if (buf.readUInt32LE(i) === EOCD64.signature) {
        return buf.slice(i);
      }
    }

    return false;
  }
}
