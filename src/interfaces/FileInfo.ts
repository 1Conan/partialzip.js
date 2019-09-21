// Disable max line length because long descriptions and URLs
// tslint:disable:max-line-length

/**
 * Info of each file in the central directory.
 * Similar to Local File Header.
 * Descriptions taken from [Zip - Wikipedia](https://en.wikipedia.org/wiki/Zip_(file_format)#Central_directory_file_header)
 * */
export interface IFileInfo {

  /** Central Directory File Header Signature */
  signature: number;

  /** Version made by */
  version: number;

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

  /** File comment length (k) */
  fileCommentLength: number;

  /** Disk number where file starts. Used in multi part Zips. */
  diskNo: number;

  /** Internal file attributes */
  internalAttributes: number;

  /** External file attributes */
  externalAttributes: number;

  /**
   * Relative offset of local file header.
   * This is the number of bytes between the start of the first disk on which the file occurs,
   * and the start of the local file header.
   * This allows software reading the central directory to locate the position of the file inside the ZIP file.
   */
  offset: number;

  /** File name. */
  fileName: string;

  /** Extra Field */
  extraField: {
    Zip64?: {
      uncompressedSize?: BigInt;
      compressedSize?: BigInt;
      offset?: BigInt;
    };
  };

  /** File comment */
  fileComment: string;
}
