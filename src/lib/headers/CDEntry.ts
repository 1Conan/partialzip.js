import Entry from '../base/Entry';
import InternalAttributes from '../bitfields/InternalAttributes';
import Flags from '../bitfields/Flags';

export enum HostOS {
  MSDOS = 0,
  OS2 = 0,
  AMIGA,
  VMS,
  UNIX,
  VM_CMS,
  ATARI_ST,
  OS2_EFS,
  MACINTOSH,
}

export default class CentralDirectoryEntry extends Entry {
  /** Central directory file header signature */
  public static signature = 0x02014b50;

  /** Version made by */
  public version: number;

  /** File comment length */
  public commentLength: number;

  /** Disk number where file starts */
  public diskNo: number;

  /** Interal file attributes */
  public internalAttributes: InternalAttributes;

  /** External file attributes */
  public externalAttributes: number;

  /** Relative offset of local file header */
  public offset: number;

  /** File comment */
  public comment: string;

  constructor(buf: Buffer) {
    super(buf);
    if (buf.readUInt32LE(0) !== CentralDirectoryEntry.signature) {
      throw new Error('Invalid Central Directory Entry');
    }

    this.version = buf.readUInt16LE(4);

    this.versionToExtract = buf.readUInt16LE(6);

    this.flags = new Flags(buf.readUInt16LE(8));

    this.compression = buf.readUInt16LE(10);

    this.lastModTime = buf.readUInt16LE(12);

    this.lastModDate = buf.readUInt16LE(14);

    this.crc32 = buf.readUInt32LE(16);

    this.compressedSize = buf.readUInt32LE(20);

    this.uncompressedSize = buf.readUInt32LE(24);

    this.fileNameLength = buf.readUInt16LE(28);

    this.extraFieldLength = buf.readUInt16LE(30);

    this.commentLength = buf.readUInt16LE(32);

    this.diskNo = buf.readUInt16LE(34);

    this.internalAttributes = new InternalAttributes(buf.readUInt16LE(36));

    this.externalAttributes = buf.readUInt32LE(38);

    this.offset = buf.readUInt32LE(42);

    this.fileName = buf.slice(46, 46 + this.fileNameLength).toString();

    const extraFieldOffset = 46 + this.fileNameLength;
    this.extraFieldRaw = buf.slice(extraFieldOffset, extraFieldOffset + this.extraFieldLength);

    const commentOffset = extraFieldOffset + this.extraFieldLength;
    this.comment = buf.slice(commentOffset, commentOffset + this.commentLength).toString();
  }

  get hostOS(): HostOS {
    return this.version >> 8;
  }

  get zipVersion() {
    return this.version & 0xff;
  }
}
