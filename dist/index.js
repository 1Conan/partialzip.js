"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var axios_1 = __importDefault(require("axios")); // tslint:disable-line:import-name
var zlib_1 = __importDefault(require("zlib"));
var default_1 = /** @class */ (function () {
    function default_1(options) {
        this.url = options.url;
        this.headers = options.headers === undefined ? {} : options.headers;
        this.length = 0;
        this.fileCount = 0;
        this.cdRange = {
            end: 0,
            start: 0,
        };
        this.files = new Map();
    }
    default_1.prototype.init = function () {
        return __awaiter(this, void 0, void 0, function () {
            var res, acceptRanges, contentLength, eocdData, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, axios_1.default.head(this.url, {
                            headers: this.headers,
                        })];
                    case 1:
                        res = _b.sent();
                        if (res.status > 400) {
                            throw new Error("HTTP Error: " + res.status);
                        }
                        acceptRanges = res.headers['accept-ranges'];
                        contentLength = res.headers['content-length'];
                        if (contentLength === null) {
                            throw new Error('Content Length is null');
                        }
                        if (acceptRanges === null || !acceptRanges.match(/byte/i)) {
                            throw new Error('Server doesn\'t support partial downloads');
                        }
                        this.length = parseInt(contentLength, 10);
                        return [4 /*yield*/, this.getEocd()];
                    case 2:
                        eocdData = _b.sent();
                        _a = this;
                        return [4 /*yield*/, this.getCd(eocdData.cdOffset, eocdData.cdOffset + eocdData.cdSize - 1)];
                    case 3:
                        _a.files = _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    default_1.prototype.list = function () {
        return Array.from(this.files.keys());
    };
    default_1.prototype.get = function (obj) {
        return __awaiter(this, void 0, void 0, function () {
            var data, signature, compressionMethod, fileNameLength, extraFieldLength, localFileHeaderEnd, newData;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (obj.fileName.endsWith('/'))
                            throw new Error('Can\'t fetch base directories!');
                        return [4 /*yield*/, this.partialGet(obj.offset, obj.offset + 512)];
                    case 1:
                        data = _a.sent();
                        signature = data.readUInt32LE(0);
                        if (signature !== 0x04034b50)
                            throw new Error('Invalid Local File Signature');
                        compressionMethod = data.readUInt16LE(8);
                        fileNameLength = data.readUInt16LE(26);
                        extraFieldLength = data.readUInt16LE(28);
                        localFileHeaderEnd = 30 + fileNameLength + extraFieldLength;
                        return [4 /*yield*/, this
                                .partialGet(obj.offset + localFileHeaderEnd, obj.offset + obj.compressedSize + localFileHeaderEnd - 1)];
                    case 2:
                        newData = _a.sent();
                        if (compressionMethod === 0) {
                            return [2 /*return*/, newData];
                        }
                        if (compressionMethod === 8) {
                            return [2 /*return*/, zlib_1.default.inflateRawSync(newData)];
                        }
                        throw new Error('Compression method not supported');
                }
            });
        });
    };
    default_1.prototype.getCd = function (start, end) {
        return __awaiter(this, void 0, void 0, function () {
            var parsedFiles, data, files, _i, files_1, file, fileInfo, fileDataBuf, fileData;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        parsedFiles = new Map();
                        return [4 /*yield*/, this.partialGet(start, end)];
                    case 1:
                        data = _a.sent();
                        files = bufferSplit(data, Buffer.from('\x50\x4b\x01\x02'));
                        this.fileCount = files.length;
                        for (_i = 0, files_1 = files; _i < files_1.length; _i++) {
                            file = files_1[_i];
                            fileInfo = {
                                signature: file.readUInt32LE(0),
                                version: file.readUInt16LE(4),
                                versionNeededToExtract: file.readUInt16LE(6),
                                flags: file.readUInt16LE(8),
                                compressionMethod: file.readUInt16LE(10),
                                lastModTime: file.readUInt16LE(12),
                                lastModDate: file.readUInt16LE(14),
                                crc32: file.readUInt32LE(16),
                                compressedSize: file.readUInt32LE(20),
                                uncompressedSize: file.readUInt32LE(24),
                                fileNameLength: file.readUInt16LE(28),
                                extraFieldLength: file.readUInt16LE(30),
                                fileCommentLength: file.readUInt16LE(32),
                                diskNo: file.readUInt16LE(34),
                                internalAttributes: file.readUInt16LE(36),
                                externalAttributes: file.readUInt32LE(38),
                                offset: file.readUInt32LE(42),
                            };
                            fileDataBuf = file.slice(46);
                            fileData = {
                                fileName: fileDataBuf.slice(0, fileInfo.fileNameLength).toString(),
                            };
                            parsedFiles.set(fileData.fileName, Object.assign(fileInfo, fileData));
                        }
                        return [2 /*return*/, parsedFiles];
                }
            });
        });
    };
    default_1.prototype.getEocd = function () {
        return __awaiter(this, void 0, void 0, function () {
            var eocdrWithoutCommentSize, maxCommentSize, bufferSize, bufferReadStart, eocdTempBuffer, eocdBuffer, i;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        eocdrWithoutCommentSize = 22;
                        maxCommentSize = 0xffff;
                        bufferSize = Math.min(eocdrWithoutCommentSize + maxCommentSize, this.length);
                        bufferReadStart = this.length - bufferSize;
                        return [4 /*yield*/, this.partialGet(bufferReadStart, this.length - 1)];
                    case 1:
                        eocdTempBuffer = _a.sent();
                        for (i = eocdTempBuffer.length - 22; i >= 0; i -= 1) {
                            if (eocdTempBuffer.readUInt32LE(i) !== 0x06054b50)
                                continue;
                            eocdBuffer = eocdTempBuffer.slice(i);
                        }
                        if (eocdBuffer === undefined)
                            throw new Error('Cannot find End of Central Directory');
                        return [2 /*return*/, {
                                signature: eocdBuffer.readUInt32LE(0),
                                diskNumber: eocdBuffer.readUInt16LE(4),
                                cdStart: eocdBuffer.readUInt16LE(6),
                                cdTotal: eocdBuffer.readUInt16LE(8),
                                cdEntries: eocdBuffer.readUInt16LE(10),
                                cdSize: eocdBuffer.readUInt32LE(12),
                                cdOffset: eocdBuffer.readUInt32LE(16),
                                commentLength: eocdBuffer.readUInt16LE(20),
                                comment: eocdBuffer.slice(22),
                            }];
                }
            });
        });
    };
    default_1.prototype.partialGet = function (start, end) {
        return __awaiter(this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, axios_1.default.get(this.url, {
                            headers: Object.assign(this.headers, { Range: "bytes=" + start + "-" + end }),
                            responseType: 'arraybuffer',
                        })];
                    case 1:
                        res = _a.sent();
                        return [2 /*return*/, Buffer.from(res.data)];
                }
            });
        });
    };
    return default_1;
}());
exports.default = default_1;
function bufferSplit(buffer, buffer2, index) {
    if (index === void 0) { index = 0; }
    var results = [];
    var i = index;
    do {
        var start = buffer.indexOf(buffer2, i);
        var end = buffer.indexOf(buffer2, i + 1);
        results.push(buffer.slice(start, end));
        i = end;
    } while (i !== -1);
    return results;
}
