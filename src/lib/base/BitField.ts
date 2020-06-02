export default class BitField {
  /** raw number */
  public raw: number;

  constructor(num: number) {
    this.raw = num;
  }

  public getBit(pos: number) {
    return this.raw & (1 << pos);
  }

  public setBit(pos: number) {
    this.raw |= 1 << pos;
  }

  public clearBit(pos: number) {
    this.raw &= ~(1 << pos);
  }

  public toBitstring() {
    return this.raw.toString(2);
  }
}
