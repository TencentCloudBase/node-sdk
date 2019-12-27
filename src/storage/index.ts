import request from 'request'
import fs from 'fs'
import httpRequest from '../utils/httpRequest'
import { parseString } from 'xml2js'
import { E } from '../utils/utils'
import { ERROR } from '../const/code'
import {
    ICustomReqOpts,
    ICustomErrRes,
    IDeleteFileRes,
    IGetFileUrlRes,
    IDownloadFileRes,
    IUploadFileRes
} from '../type'
import { CloudBase } from '../cloudbase'

export async function parseXML(str) {
    return new Promise((resolve, reject) => {
        parseString(str, (err, result) => {
            if (err) {
                reject(err)
            } else {
                resolve(result)
            }
        })
    })
}

/*
 * 上传文件
 * @param {string} cloudPath 上传后的文件路径
 * @param {fs.ReadStream} fileContent  上传文件的二进制流
 */
export async function uploadFile(
    cloudbase: CloudBase,
    { cloudPath, fileContent },
    opts?: ICustomReqOpts
): Promise<IUploadFileRes> {
    const {
        data: { url, token, authorization, fileId, cosFileId }
    } = await getUploadMetadata(cloudbase, { cloudPath }, opts)

    const formData = {
        Signature: authorization,
        'x-cos-security-token': token,
        'x-cos-meta-fileid': cosFileId,
        key: cloudPath,
        file: fileContent
    }

    let body: any = await new Promise((resolve, reject) => {
        request({ url, formData: formData, method: 'post' }, function(err, res, body) {
            if (err) {
                reject(err)
            } else {
                resolve(body)
            }
        })
    })

    body = await parseXML(body)
    if (body && body.Error) {
        const {
            Code: [code],
            Message: [message]
        } = body.Error
        if (code === 'SignatureDoesNotMatch') {
            throw E({ ...ERROR.SYS_ERR, message })
        }

        throw E({ ...ERROR.STORAGE_REQUEST_FAIL, message })
    }

    return {
        fileID: fileId
    }
}

/**
 * 删除文件
 * @param {Array.<string>} fileList 文件id数组
 */
export async function deleteFile(
    cloudbase: CloudBase,
    { fileList },
    opts?: ICustomReqOpts
): Promise<ICustomErrRes | IDeleteFileRes> {
    if (!fileList || !Array.isArray(fileList)) {
        throw E({
            ...ERROR.INVALID_PARAM,
            message: 'fileList必须是非空的数组'
        })
    }

    for (let file of fileList) {
        if (!file || typeof file !== 'string') {
            throw E({
                ...ERROR.INVALID_PARAM,
                message: 'fileList的元素必须是非空的字符串'
            })
        }
    }

    let params = {
        action: 'storage.batchDeleteFile',
        fileid_list: fileList
    }

    return httpRequest({
        config: cloudbase.config,
        params,
        method: 'post',
        opts,
        headers: {
            'content-type': 'application/json'
        }
    }).then(res => {
        if (res.code) {
            return res
        } else {
            return {
                fileList: res.data.delete_list,
                requestId: res.requestId
            }
        }
    })
}

/**
 * 获取文件下载链接
 * @param {Array.<Object>} fileList
 */
export async function getTempFileURL(
    cloudbase: CloudBase,
    { fileList },
    opts?: ICustomReqOpts
): Promise<ICustomErrRes | IGetFileUrlRes> {
    if (!fileList || !Array.isArray(fileList)) {
        throw E({
            ...ERROR.INVALID_PARAM,
            message: 'fileList必须是非空的数组'
        })
    }

    let file_list = []
    for (let file of fileList) {
        if (typeof file === 'object') {
            if (!file.hasOwnProperty('fileID') || !file.hasOwnProperty('maxAge')) {
                throw E({
                    ...ERROR.INVALID_PARAM,
                    message: 'fileList的元素如果是对象，必须是包含fileID和maxAge的对象'
                })
            }

            file_list.push({
                fileid: file.fileID,
                max_age: file.maxAge
            })
        } else if (typeof file === 'string') {
            file_list.push({
                fileid: file
            })
        } else {
            throw E({
                ...ERROR.INVALID_PARAM,
                message: 'fileList的元素如果不是对象，则必须是字符串'
            })
        }
    }

    let params = {
        action: 'storage.batchGetDownloadUrl',
        file_list
    }
    // console.log(params);

    return httpRequest({
        config: cloudbase.config,
        params,
        method: 'post',
        opts,
        headers: {
            'content-type': 'application/json'
        }
    }).then(res => {
        // console.log(res);
        if (res.code) {
            return res
        } else {
            return {
                fileList: res.data.download_list,
                requestId: res.requestId
            }
        }
    })
}

export async function downloadFile(
    cloudbase: CloudBase,
    params: { fileID: string; tempFilePath?: string },
    opts?: ICustomReqOpts
): Promise<ICustomErrRes | IDownloadFileRes> {
    let tmpUrl
    const { fileID, tempFilePath } = params
    const tmpUrlRes = await getTempFileURL(
        cloudbase,
        {
            fileList: [
                {
                    fileID,
                    maxAge: 600
                }
            ]
        },
        opts
    )
    // console.log(tmpUrlRes);
    const res = tmpUrlRes.fileList[0]

    if (res.code !== 'SUCCESS') {
        return res
    }

    tmpUrl = res.tempFileURL
    tmpUrl = encodeURI(tmpUrl)

    let req = request({
        url: tmpUrl,
        encoding: null,
        proxy: cloudbase.config.proxy
    })

    return new Promise((resolve, reject) => {
        let fileContent = Buffer.alloc(0)
        req.on('response', function(response) {
            if (response && Number(response.statusCode) === 200) {
                if (tempFilePath) {
                    response.pipe(fs.createWriteStream(tempFilePath))
                } else {
                    response.on('data', data => {
                        fileContent = Buffer.concat([fileContent, data])
                    })
                }
                response.on('end', () => {
                    resolve({
                        fileContent: tempFilePath ? undefined : fileContent,
                        message: '文件下载完成'
                    })
                })
            } else {
                reject(response)
            }
        })
    })
}

export async function getUploadMetadata(
    cloudbase: CloudBase,
    { cloudPath },
    opts?: ICustomReqOpts
) {
    let params = {
        action: 'storage.getUploadMetadata',
        path: cloudPath
    }

    const res = await httpRequest({
        config: cloudbase.config,
        params,
        method: 'post',
        opts,
        headers: {
            'content-type': 'application/json'
        }
    })

    if (res.code) {
        throw E({
            ...ERROR.STORAGE_REQUEST_FAIL,
            message: 'get upload metadata failed: ' + res.code
        })
    } else {
        return res
    }
}
