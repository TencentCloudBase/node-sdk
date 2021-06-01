"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
exports.kMetadataBaseUrl = 'http://metadata.tencentyun.com';
var kMetadataVersions;
(function (kMetadataVersions) {
    kMetadataVersions["v20170919"] = "2017-09-19";
    kMetadataVersions["v1.0"] = "1.0";
    kMetadataVersions["latest"] = "latest";
})(kMetadataVersions = exports.kMetadataVersions || (exports.kMetadataVersions = {}));
function isAppId(appIdStr) {
    return /^[1-9][0-9]{4,64}$/gim.test(appIdStr);
}
exports.isAppId = isAppId;
async function lookup(path) {
    const url = `${exports.kMetadataBaseUrl}/${kMetadataVersions.latest}/${path}`;
    const resp = await axios_1.default.get(url);
    if (resp.status === 200) {
        return resp.data;
    }
    else {
        throw new Error(`[ERROR] GET ${url} status: ${resp.status}`);
    }
}
exports.lookup = lookup;
const metadataCache = {
    appId: undefined
};
async function lookupAppId() {
    if (metadataCache.appId === undefined) {
        metadataCache.appId = '';
        try {
            const appId = await lookup('meta-data/app-id');
            if (isAppId(appId)) {
                metadataCache.appId = appId;
            }
        }
        catch (e) {
            console.warn('[WARN] lookupAppId error: ', e.message);
        }
    }
    return metadataCache.appId || '';
}
exports.lookupAppId = lookupAppId;
