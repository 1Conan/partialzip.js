import Base from '../base/Base';

export default class ExtraFields extends Base {
  public fields: { id: number; length: number; data: Buffer }[] = [];

  constructor(buf: Buffer) {
    super(buf);

    let i = 0;

    while (i < buf.length - 3) {
      const id = buf.readUInt16LE(i);
      const size = buf.readUInt16LE(i + 2);
      const start = i + 4;
      const end = start + size;
      if (end > buf.length) throw new Error('Extra Field length exceeds buffer size');
      const data = buf.slice(start, end);

      this.fields.push({ id, data, length: size });

      i = end;
    }
  }

  get zip64() {
    const field = this.getField(0x0001);
    if (!field) return undefined;

    return {
      uncompressedSize: field.length >= 8 ? field.data.readBigUInt64LE(0) : BigInt(-1),
      compressedSize: field.length >= 16 ? field.data.readBigUInt64LE(8) : BigInt(-1),
      offset: field.length >= 24 ? field.data.readBigUInt64LE(16) : BigInt(-1),
      diskNo: field.length >= 28 ? field.data.readUInt32LE(24) : -1,
    };
  }

  private getField(id: number) {
    const field = this.fields.find((x) => x.id === id);
    if (!field) return undefined;
    return field;
  }
}
