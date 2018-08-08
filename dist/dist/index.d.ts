/// <reference types="node" />
export default class {
    fileCount: number;
    files: any;
    private url;
    private length;
    private cdRange;
    constructor(options: IOptions);
    init(): Promise<void>;
    list(): string[];
    get(obj: IFileData): Promise<Buffer>;
    private getCd;
    private getEocd;
    private partialGet;
}
interface IFileData {
    signature: number;
    version: number;
    versionNeededToExtract: number;
    flags: number;
    compressionMethod: number;
    lastModTime: number;
    lastModDate: number;
    crc32: number;
    compressedSize: number;
    uncompressedSize: number;
    fileNameLength: number;
    extraFieldLength: number;
    fileCommentLength: number;
    diskNo: number;
    internalAttributes: number;
    externalAttributes: number;
    offset: number;
    fileName: string;
}
interface IOptions {
    url: string;
}
export {};
