import tcb from '../../src/index'
import fs from 'fs'
import assert from 'assert'
import config from '../config.local'
import { ERROR } from '../../src/const/code'
import { ICustomErrRes } from '../../src/type'

describe('storage.uploadFile: 上传文件', () => {
    const app = tcb.init(config)

    let fileContent = fs.createReadStream(`${__dirname}/cos.jpeg`)
    // let fileContent = Buffer.from('aaaaa')
    it('校验删除文件参数', async () => {
        try {
            let result = await app.deleteFile({ fileList: null })
        } catch (e) {
            assert(e.code === ERROR.INVALID_PARAM.code)
        }

        try {
            let result = await app.deleteFile({ fileList: {} })
        } catch (e) {
            assert(e.code === ERROR.INVALID_PARAM.code)
        }

        try {
            let result = await app.deleteFile({ fileList: [1] })
        } catch (e) {
            assert(e.code === ERROR.INVALID_PARAM.code)
        }
    }, 30000)

    it('删除超出文件数限制50', async () => {
        let i = 0
        let fileList = []
        while (i++ <= 50) {
            fileList.push('cloud://unexistJpg.jpg')
        }
        let result
        try {
            result = await app.deleteFile({ fileList })
        } catch (e) {
            assert((<ICustomErrRes>e).code === ERROR.INVALID_PARAM.code)
        }
    }, 30000)

    it('上传文件、删除文件', async () => {
        try {
            const result1 = await app.uploadFile({
                // cloudPath: "test-admin.jpeg",
                cloudPath: 'ab.jpeg',
                fileContent
            })
            console.log('result1:', result1)
        } catch (e) {
            console.log('e:', e)
        }

        // assert(result1.fileID, '上传文件失败')
        // const fileID = result1.fileID
        // const result2 = await app.getTempFileURL({
        //     fileList: [
        //         {
        //             fileID: fileID,
        //             maxAge: 60
        //         }
        //     ]
        // })
        // console.log('result2:', result2)
        // assert(result2.fileList[0].tempFileURL, '获取下载链接失败')

        // const result3 = await app.deleteFile({
        //     fileList: [fileID]
        // })
        // console.log('result3:', result3)

        // assert(result3.fileList[0].fileID, '删除文件失败')
        // assert.strictEqual(fileID, result3.fileList[0].fileID)
    }, 30000)
})
