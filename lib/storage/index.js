"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const request_1 = __importDefault(require("request"));
const fs_1 = __importDefault(require("fs"));
const httpRequest_1 = __importDefault(require("../utils/httpRequest"));
const xml2js_1 = require("xml2js");
const utils_1 = require("../utils/utils");
const code_1 = require("../const/code");
const cloudbase_1 = require("../cloudbase");
async function parseXML(str) {
    return new Promise((resolve, reject) => {
        xml2js_1.parseString(str, (err, result) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(result);
            }
        });
    });
}
exports.parseXML = parseXML;
/*
 * 上传文件
 * @param {string} cloudPath 上传后的文件路径
 * @param {fs.ReadStream} fileContent  上传文件的二进制流
 */
async function uploadFile(cloudbase, { cloudPath, fileContent }, opts) {
    const { data: { url, token, authorization, fileId, cosFileId } } = await getUploadMetadata(cloudbase, { cloudPath }, opts);
    const formData = {
        Signature: authorization,
        'x-cos-security-token': token,
        'x-cos-meta-fileid': cosFileId,
        key: cloudPath,
        file: fileContent
    };
    let body = await new Promise((resolve, reject) => {
        request_1.default({ url, formData: formData, method: 'post' }, function (err, res, body) {
            if (err) {
                reject(err);
            }
            else {
                resolve(body);
            }
        });
    });
    body = await parseXML(body);
    if (body && body.Error) {
        const { Code: [code], Message: [message] } = body.Error;
        if (code === 'SignatureDoesNotMatch') {
            return utils_1.processReturn(cloudbase.config.throwOnCode, Object.assign({}, code_1.ERROR.SYS_ERR, { message }));
        }
        return utils_1.processReturn(cloudbase.config.throwOnCode, Object.assign({}, code_1.ERROR.STORAGE_REQUEST_FAIL, { message }));
    }
    return {
        fileID: fileId
    };
}
exports.uploadFile = uploadFile;
/**
 * 删除文件
 * @param {Array.<string>} fileList 文件id数组
 */
async function deleteFile(cloudbase, { fileList }, opts) {
    if (!fileList || !Array.isArray(fileList)) {
        return utils_1.processReturn(cloudbase.config.throwOnCode, Object.assign({}, code_1.ERROR.INVALID_PARAM, { message: 'fileList必须是非空的数组' }));
    }
    for (let file of fileList) {
        if (!file || typeof file !== 'string') {
            return utils_1.processReturn(cloudbase.config.throwOnCode, Object.assign({}, code_1.ERROR.INVALID_PARAM, { message: 'fileList的元素必须是非空的字符串' }));
        }
    }
    let params = {
        action: 'storage.batchDeleteFile',
        fileid_list: fileList
    };
    return httpRequest_1.default({
        config: cloudbase.config,
        params,
        method: 'post',
        opts,
        headers: {
            'content-type': 'application/json'
        }
    }).then(res => {
        if (res.code) {
            return res;
        }
        //     throw E({ ...res })
        // } else {
        return {
            fileList: res.data.delete_list,
            requestId: res.requestId
        };
        // }
    });
}
exports.deleteFile = deleteFile;
/**
 * 获取文件下载链接
 * @param {Array.<Object>} fileList
 */
async function getTempFileURL(cloudbase, { fileList }, opts) {
    if (!fileList || !Array.isArray(fileList)) {
        return utils_1.processReturn(cloudbase.config.throwOnCode, Object.assign({}, code_1.ERROR.INVALID_PARAM, { message: 'fileList必须是非空的数组' }));
    }
    let file_list = [];
    for (let file of fileList) {
        if (typeof file === 'object') {
            if (!file.hasOwnProperty('fileID') || !file.hasOwnProperty('maxAge')) {
                return utils_1.processReturn(cloudbase.config.throwOnCode, Object.assign({}, code_1.ERROR.INVALID_PARAM, { message: 'fileList的元素如果是对象，必须是包含fileID和maxAge的对象' }));
            }
            file_list.push({
                fileid: file.fileID,
                max_age: file.maxAge
            });
        }
        else if (typeof file === 'string') {
            file_list.push({
                fileid: file
            });
        }
        else {
            return utils_1.processReturn(cloudbase.config.throwOnCode, Object.assign({}, code_1.ERROR.INVALID_PARAM, { message: 'fileList的元素如果不是对象，则必须是字符串' }));
        }
    }
    let params = {
        action: 'storage.batchGetDownloadUrl',
        file_list
    };
    // console.log(params);
    return httpRequest_1.default({
        config: cloudbase.config,
        params,
        method: 'post',
        opts,
        headers: {
            'content-type': 'application/json'
        }
    }).then(res => {
        if (res.code) {
            return res;
        }
        // if (res.code) {
        //     throw E({ ...res })
        // } else {
        return {
            fileList: res.data.download_list,
            requestId: res.requestId
        };
        // }
    });
}
exports.getTempFileURL = getTempFileURL;
async function downloadFile(cloudbase, params, opts) {
    let tmpUrl;
    const { fileID, tempFilePath } = params;
    const tmpUrlRes = await getTempFileURL(cloudbase, {
        fileList: [
            {
                fileID,
                maxAge: 600
            }
        ]
    }, opts);
    // console.log(tmpUrlRes);
    const res = tmpUrlRes.fileList[0];
    if (res.code !== 'SUCCESS') {
        return utils_1.processReturn(cloudbase.config.throwOnCode, Object.assign({}, res));
    }
    tmpUrl = res.tempFileURL;
    tmpUrl = encodeURI(tmpUrl);
    let req = request_1.default({
        url: tmpUrl,
        encoding: null,
        proxy: cloudbase.config.proxy
    });
    return new Promise((resolve, reject) => {
        let fileContent = Buffer.alloc(0);
        req.on('response', function (response) {
            /* istanbul ignore else  */
            if (response && Number(response.statusCode) === 200) {
                if (tempFilePath) {
                    response.pipe(fs_1.default.createWriteStream(tempFilePath));
                }
                else {
                    response.on('data', data => {
                        fileContent = Buffer.concat([fileContent, data]);
                    });
                }
                response.on('end', () => {
                    resolve({
                        fileContent: tempFilePath ? undefined : fileContent,
                        message: '文件下载完成'
                    });
                });
            }
            else {
                reject(response);
            }
        });
    });
}
exports.downloadFile = downloadFile;
async function getUploadMetadata(cloudbase, { cloudPath }, opts) {
    let params = {
        action: 'storage.getUploadMetadata',
        path: cloudPath
    };
    const res = await httpRequest_1.default({
        config: cloudbase.config,
        params,
        method: 'post',
        opts,
        headers: {
            'content-type': 'application/json'
        }
    });
    // if (res.code) {
    //     throw E({
    //         ...ERROR.STORAGE_REQUEST_FAIL,
    //         message: 'get upload metadata failed: ' + res.code
    //     })
    // } else {
    return res;
    // }
}
exports.getUploadMetadata = getUploadMetadata;
async function getFileAuthority(cloudbase, { fileList }, opts) {
    const { LOGINTYPE } = cloudbase_1.CloudBase.getCloudbaseContext();
    if (!Array.isArray(fileList)) {
        throw utils_1.E(Object.assign({}, code_1.ERROR.INVALID_PARAM, { message: '[node-sdk] getCosFileAuthority fileList must be a array' }));
    }
    if (fileList.some(file => {
        if (!file || !file.path) {
            return true;
        }
        if (['READ', 'WRITE', 'READWRITE'].indexOf(file.type) === -1) {
            return true;
        }
        return false;
    })) {
        throw utils_1.E(Object.assign({}, code_1.ERROR.INVALID_PARAM, { message: '[node-sdk] getCosFileAuthority fileList param error' }));
    }
    const userInfo = cloudbase.auth().getUserInfo();
    const { openId, uid } = userInfo;
    if (!openId && !uid) {
        throw utils_1.E(Object.assign({}, code_1.ERROR.INVALID_PARAM, { message: '[node-sdk] admin do not need getCosFileAuthority.' }));
    }
    let params = {
        action: 'storage.getFileAuthority',
        openId,
        uid,
        loginType: LOGINTYPE,
        fileList
    };
    const res = await httpRequest_1.default({
        config: cloudbase.config,
        params,
        method: 'post',
        headers: {
            'content-type': 'application/json'
        }
    });
    if (res.code) {
        /* istanbul ignore next  */
        throw utils_1.E(Object.assign({}, res, { message: '[node-sdk] getCosFileAuthority failed: ' + res.code }));
    }
    else {
        return res;
    }
}
exports.getFileAuthority = getFileAuthority;
