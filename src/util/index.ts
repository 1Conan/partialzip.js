import { inflateRaw } from 'zlib';

/**
 * Split a Buffer into an array of buffers using the specified separator.
 *
 * @param buf - Buffer to be split
 * @param separator - A buffer that is used in separating the buffer.
 * If omitted, a single-element array containing the entire buffer is returned.
 */
export function bufferSplit(buf: Buffer, separator: Buffer) {
  const pieces: Buffer[] = [];

  let i = 0;

  // eslint-disable-next-line no-cond-assign
  while ((i = buf.indexOf(separator, i)) > -1) {
    const end = buf.indexOf(separator, i + 1);

    // the undefined is for last elements
    pieces.push(buf.slice(i, end === -1 ? undefined : end));

    i = end;
  }

  return pieces;
}

/**
 * zlib inflate promisified
 *
 * @param buf - Buffer to inflate
 */
export async function inflate(buf: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    inflateRaw(buf, (err, result) => {
      if (err) return reject(err);
      return resolve(result);
    });
  });
}
