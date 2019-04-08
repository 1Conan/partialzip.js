import { inflateRaw as inflate } from 'pako';

export function inflateRaw(buf: Buffer, cb: (err: Error | null, result?: Buffer) => void) {
  try {
    cb(null, Buffer.from(inflate(buf)));
  } catch (e) {
    cb(e);
  }
}
