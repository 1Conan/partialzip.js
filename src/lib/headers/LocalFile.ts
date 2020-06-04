import Entry from '../base/Entry';
import Flags from '../bitfields/Flags';
import ExtraField from './ExtraField';

export default class LocalFile extends Entry {
  /** Local file header signature */
  public static signature = 0x04034b50;

  constructor(buf: Buffer) {
    super(buf);
    if (buf.readUInt32LE(0) !== LocalFile.signature) {
      throw new Error('Invalid Local File Header Signature');
    }

    this.versionToExtract = buf.readUInt16LE(4);

    this.flags = new Flags(buf.readUInt16LE(6));

    this.compression = buf.readUInt16LE(8);

    this.lastModTime = buf.readUInt16LE(10);

    this.lastModDate = buf.readUInt16LE(12);

    this.crc32 = buf.readUInt32LE(14);

    this.compressedSize = buf.readUInt32LE(18);

    this.uncompressedSize = buf.readUInt32LE(22);

    this.fileNameLength = buf.readUInt16LE(26);

    this.extraFieldLength = buf.readUInt16LE(28);

    this.fileName = buf.slice(30, 30 + this.fileNameLength).toString();

    const extraFieldOffset = 30 + this.fileNameLength;
    this.extraFieldRaw = buf.slice(extraFieldOffset, extraFieldOffset + this.extraFieldLength);
    this.extraField = new ExtraField(this.extraFieldRaw);
  }
}
