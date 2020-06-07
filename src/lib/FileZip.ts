import { promises } from 'fs';
import Zip from './base/Zip';

const { stat, open } = promises;

export default class FileZip extends Zip {
  async preInit() {
    const fileInfo = await stat(this.path);
    this.size = fileInfo.size;
  }

  async partialGet(start: number | bigint, end: number | bigint) {
    const fd = await open(this.path, 'r');
    const length = Number(end) - Number(start);
    const data = await fd.read(Buffer.alloc(length), null, length, Number(start));
    await fd.close();
    return data.buffer;
  }
}
