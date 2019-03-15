// Disable max line length because long descriptions and URLs
// tslint:disable:max-line-length

/**
 * Info of each file in the central directory.
 * Similar to Local File Header.
 * Descriptions taken from [Zip - Wikipedia](https://en.wikipedia.org/wiki/Zip_(file_format)#Central_directory_file_header)
 * */
export interface ILocalFileInfo {

  /** Central Directory File Header Signature */
  signature: number;

  /** Version needed to extract (minimum) */
  versionNeededToExtract: number;

  /** General purpose bit flag */
  flags: number;

  /** Compression method */
  compressionMethod: number;

  /** File last modification time */
  lastModTime: number;

  /** File last modification date */
  lastModDate: number;

  /** CRC-32 Hash */
  crc32: number;

  /** Compressed size */
  compressedSize: number;

  /** Uncompressed size */
  uncompressedSize: number;

  /** File name length (n) */
  fileNameLength: number;

  /** Extra field length (m) */
  extraFieldLength: number;

  /** File name. */
  fileName: string;

  /** Extra Field */
  extraField: Buffer;
}
