import fetch from 'cross-fetch';
import Zip from './base/Zip';

export default class PartialZip extends Zip {
  /** Request headers */
  private headers: Record<string, string>;

  constructor(url: string, headers?: Record<string, string>) {
    super(url);
    this.headers = headers || {};
  }

  async preInit() {
    const req = await fetch(this.path, {
      method: 'HEAD',
      headers: this.headers,
    });

    if (req.status > 400) {
      throw new Error(`HTTP Error (${req.status}): ${req.statusText}`);
    }

    const acceptRanges = req.headers.get('accept-ranges');
    if (!acceptRanges || !acceptRanges.includes('bytes')) {
      throw new Error('Server does not support partial downloads');
    }

    const contentLength = req.headers.get('content-length');
    if (!contentLength) {
      throw new Error('Content-Length not found');
    }

    this.size = parseInt(contentLength, 10);
  }

  /**
   * Downloads part of a file from a url.
   *
   * @param start - start byte offset to get
   * @param end - end byte offset to get
   */
  async partialGet(start: number | bigint, end: number | bigint) {
    const req = await fetch(this.path, {
      headers: {
        ...this.headers,
        Range: `bytes=${start}-${end}`,
      },
    });

    return Buffer.from(await req.arrayBuffer());
  }
}
