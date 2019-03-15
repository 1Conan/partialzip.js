// Disable max line length because long descriptions and URLs
// tslint:disable:max-line-length

/**
 * End of Central Directory.
 * Comes at the end of the ZIP File.
 * Descriptions taken from [Zip - Wikipedia](https://en.wikipedia.org/wiki/Zip_(file_format)#Central_directory_file_header)
 */
export interface IEoCD {

  /** End of central directory signature */
  signature: number;

  /** Number of this disk */
  diskNumber: number;

  /** Disk where central directory starts */
  cdStart: number;

  /** Number central directory records on this disk */
  cdTotal: number;

  /**  Total number of central directory records */
  cdEntries: number;

  /** Size of central directory */
  cdSize: number;

  /** Offset of start of central directory, relative to the start of the archive */
  cdOffset: number;

  /** Comment length (n) */
  commentLength: number;

  /** Comment */
  comment: Buffer;
}
