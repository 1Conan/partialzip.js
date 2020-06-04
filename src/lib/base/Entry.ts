import Base from './Base';
import Flags from '../bitfields/Flags';
import ExtraFields from '../headers/ExtraField';

export default class Entry extends Base {
  /** Version needed to extract (minimum) */
  public versionToExtract!: number;

  /** General purpose bit flag */
  public flags!: Flags;

  /** Compression Method */
  public compression!: number;

  /** File last modification time */
  public lastModTime!: number;

  /** File last modification date */
  public lastModDate!: number;

  /** CRC-32 of uncompressed data */
  public crc32!: number;

  /** Compressed size */
  public compressedSize!: number;

  /** Uncompressed size */
  public uncompressedSize!: number;

  /** File name length */
  public fileNameLength!: number;

  /** Extra field length */
  public extraFieldLength!: number;

  /** File name */
  public fileName!: string;

  /** Raw Extra Field */
  public extraFieldRaw!: Buffer;

  /** Extra Field */
  public extraField!: ExtraFields;

  /** File last modification (library specific) */
  get lastMod() {
    // Source: https://github.com/thejoshwolfe/yauzl/blob/master/index.js#L594
    const date = this.lastModDate;
    const time = this.lastModTime;

    const day = date & 0x1f;
    const month = (date >> 5) & 0xf;
    const year = ((date >> 9) & 0x7f) + 1980;

    const ms = 0;
    const second = (time & 0x1f) * 2;
    const minute = (time >> 5) & 0x3f;
    const hour = (time >> 11) & 0x1f;

    return new Date(year, month, day, hour, minute, second, ms);
  }
}
