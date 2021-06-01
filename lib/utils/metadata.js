"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.kMetadataBaseUrl = 'http://metadata.tencentyun.com';
var kMetadataVersions;
(function (kMetadataVersions) {
    kMetadataVersions["v20170919"] = "2017-09-19";
    kMetadataVersions["v1.0"] = "1.0";
    kMetadataVersions["latest"] = "latest";
})(kMetadataVersions = exports.kMetadataVersions || (exports.kMetadataVersions = {}));
const request_1 = __importDefault(require("request"));
function lookup(path) {
    return new Promise((resolve, reject) => {
        const url = `${exports.kMetadataBaseUrl}/${kMetadataVersions.latest}/${path}`;
        request_1.default.get(url, (e, res, body) => {
            if (e) {
                reject(e);
            }
            else {
                if (res.statusCode === 200) {
                    resolve(body);
                }
            }
        });
    });
}
exports.lookup = lookup;
function lookupAppId() {
    return lookup('meta-data/app-id');
}
exports.lookupAppId = lookupAppId;
