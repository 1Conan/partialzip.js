export default class Base {
  /** Raw buffer */
  public raw: Buffer;

  constructor(buf: Buffer) {
    this.raw = buf;
  }
}
