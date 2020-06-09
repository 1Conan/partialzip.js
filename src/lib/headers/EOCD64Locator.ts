import Base from '../base/Base';

export default class EOCD64Locator extends Base {
  /** Zip64 EOCD Locator Signature */
  public static signature = 0x07064b50;

  /** CD Disk Number */
  public cdDiskNo: number;

  /** Zip64 EOCD Offset */
  public offset: bigint;

  /** Total number of disks */
  public diskTotal: number;

  constructor(buf: Buffer) {
    const eocd = EOCD64Locator.find(buf);
    if (!eocd) throw new Error('Zip64 EOCD Locator not found');
    super(eocd);

    this.cdDiskNo = this.raw.readUInt32LE(4);

    this.offset = this.raw.readBigUInt64LE(8);

    this.diskTotal = this.raw.readUInt32LE(16);
  }


  public static find(buf: Buffer) {
    // eslint-disable-next-line no-plusplus
    for (let i = buf.length - 22; i >= 0; i--) {
      if (buf.readUInt32LE(i) === EOCD64Locator.signature) {
        return buf.slice(i);
      }
    }

    return false;
  }
}
