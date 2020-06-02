import Base from '../base/Base';

export default class EOCD extends Base {
  /** EOCD signature */
  private static signature = 0x06054b50;

  /** Number of this disk */
  public diskNo: number;

  /** Disk where central directory starts */
  public cdStart: number;

  /** Number of central directory records on this disk */
  public cdTotal: number;

  /** Total number of central directory records */
  public cdEntries: number;

  /** Size of central directory (bytes) */
  public cdSize: number;

  /** Offset of start of central directory, relative to start of archive */
  public cdOffset: number;

  /** Comment length */
  public commentLength: number;

  /** Comment */
  public comment: string;

  constructor(buf: Buffer) {
    const eocd = EOCD.find(buf);
    if (!eocd) throw new Error('EOCD not found');

    super(eocd);

    this.diskNo = this.raw.readUInt16LE(4);

    this.cdStart = this.raw.readUInt16LE(6);

    this.cdTotal = this.raw.readUInt16LE(8);

    this.cdEntries = this.raw.readUInt16LE(10);

    this.cdSize = this.raw.readUInt32LE(12);

    this.cdOffset = this.raw.readUInt32LE(16);

    this.commentLength = this.raw.readUInt16LE(20);

    this.comment = this.raw.slice(22, 22 + this.commentLength).toString();
  }

  public static find(buf: Buffer) {
    // eslint-disable-next-line no-plusplus
    for (let i = buf.length - 22; i >= 0; i--) {
      if (buf.readUInt32LE(i) === EOCD.signature) {
        return buf.slice(i);
      }
    }

    return false;
  }
}
