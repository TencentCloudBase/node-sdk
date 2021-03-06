import tcb from '../src/index'
import assert from 'assert'
import { ERROR } from '../lib/const/code'
import config from './config.local'

describe('tcb.init: 初始化tcb', () => {
    it.skip('mock 导入本地config报错', async () => {
        jest.resetModules()
        jest.mock('./config', () => {
            throw Error('mock config require err')
        })
        try {
            const config = require('./config.local')
        } catch (e) {
            // console.log(e)
            assert(e.message)
        }
    })

    it('初始化tcb 不传secretId或secretKey', async () => {
        try {
            const app1 = tcb.init({ secretId: 'secretId' })
            const result1 = await app1.callFunction({
                name: 'test',
                data: { a: 1 }
            })

            // console.log(result)
        } catch (err) {
            assert(err.code === ERROR.INVALID_PARAM.code)
        }

        try {
            const app2 = tcb.init({ secretKey: 'secretKey' })
            const result2 = await app2.callFunction({
                name: 'test',
                data: { a: 1 }
            })
            // console.log(result)
        } catch (err) {
            assert(err.code === ERROR.INVALID_PARAM.code)
        }

        try {
            const app3 = tcb.init()
            const result3 = await app3.callFunction({
                name: 'test',
                data: { a: 1 }
            })
        } catch (err) {
            assert(err.code === ERROR.INVALID_PARAM.code)
        }

        // const result = await app.callFunction({
        //   name: 'test',
        //   data: { a: 1 }
        // })
        // console.log(result)
        // // assert(result.result, "执行云函数失败");
        // expect.objectContaining({ result: expect.anything() })
    }, 30000)

    it('mock parseContext', async () => {
        const mockContext = {
            memory_limit_in_mb: 256,

            time_limit_in_ms: 3000,

            request_id: '3169444b-25f4-11ea-81e5-525400235f2a',

            environ:
                'WX_CLIENTIP=10.12.23.71;WX_CLIENTIPV6=::ffff:10.12.23.71;WX_APPID=wx5ceb4e4809aa1d28;WX_OPENID=oaEk445grItIBpFcJ3eRBCb6yx8g;WX_API_TOKEN=eyJWZXJzaW9uIjoxLCJLZXlWZXJzaW9uIjo4MSwiZXZlbnRJZCI6IkhFeXJYb0hrQjVDLW1OWk1JWkx3N29hNHNoZU9uMEtfNlhuM1FEb2Y0NFV6LVRJRWtyNkZSbUZ3SDhQLWNiS1dETWtyTTZ2Qm1MNXRodjR4SGgycDhXLU1sUzY1Q19uc2FiWmVaTUFpN3c4SktRIiwidGlja2V0IjoiQ0VVU2dBUSsxUzlqWnRHa0ZGenQwTmp4VENCWkM3dHp5M3Vxa252b1pqanFleUY0WEJ1WG1VMElQUGFQZElDYUlkOWxYZGZ5YUxSN3MxR3F3a3NKSEdLb3c2K1FRVGF4cWhZYlJYT3doRWVWYXEya3VGVUxmQWt4TlpKUlFvd2lBNUJsbm8zRDlaOFNZandtRUFtRG1ITitBN3lFRG40Y2NhcHh1OFdjV3N6Tjc3Rkt0WmE2czhadmNTNW9zTmlXcXU5dWRDeEszb05jM3ZuNFdtS2VOcVRqN1BWcWZJUWhMWmhKNmFxbDIvSGdONXhCRkdFaUI1RmtYVEdJUnc0TmxzYTlMUmZ5enp1dDZSazRrVTBUZ3RrOFV3S1dyS1ZKbktoSFg3WEJTSXN1SlF1VDdUL0tzL0JuS1BsM3FNZVdmeGlrKzY1K3VpSTZZb1VyMm9NUlExek11NzVKWVNDaGFGRmxYZWZFeDVBelY1TWF4QUczVHRSL2JhNGhocDZUUjE5ZlNlcVRGTUJjNUh4NXBlUzVWbkVGYWRDdTRZZS9rT0RxZW5xZCtxbnlvYjZNbXFLa0F3VkdXVzRYZ2VVNkZXSnM5Mzl5OFpGRTU1dWpVT0lNWmVDZ1VvNi9Bb201VHFxSXJvK25rK2hCUGh0L1lJVTZMU25INkVVWWtZVXhHZzJKOTBaTDFKZThFN0ZYZzFSQjFyenJGS2NsZEJndVVLWDFxVlBtWExRNndhdWpOcHpneDBNaGZvVENrenhVaWJEdWRqMlAyeG9tNlQ5L3VaM0FON1ZNeEJwckVKTzVQMDZndDV0SElCOXRxK1NPM01pVjluQk03UCtRendhVEJ6eUx6OThGUzBwSVhTdHYyYU9YMzhiZE1FVkpkQkkrUTJ1NW0xWmNENW9kODQ3UnlBPT0ifQ==;WX_CONTEXT_KEYS=WX_CLIENTIP,WX_CLIENTIPV6,WX_APPID,WX_OPENID,WX_API_TOKEN;TCB_ENV=luke-87pns;TCB_SEQID=1577153917182_0.13161529658114857_33555268;TRIGGER_SRC=tcb;TCB_SESSIONTOKEN=pNNA4UPZHja3ngOjkBJbPFCyNvL9twqf0931632f99099b88fdc6ae3e119dc84dsO99eZ7w6rzsbeh4Zf7bDQDns1glEZ761vFBDajV1ijUp-Sj-l59rfLi_s1TdYiA82HjIJzbVKnKEHzuFLJlonOIYd_NFnkQJw4MB0L6vYLcmDYYMzEhrByAddagrSdoxux6vwHfJ4B0tzzajmcXqFKkowDZJn5ZZBX1I-Sta1nfoX73qTCqlUWPAAhkhECa81LSvZrFTfsvZyLOOAvevK_kP5qy2zeYKgQtb9IvHI1xmOSj0AaTIiuqOce5i4_kLu5_Z9Gqqxc1PS2oimkhWRqL79E-sW-fF3HpuGD01W832B2wn9W3vpaKi50lyN2gAyKW3Wf0ASA_vPVyZziR20fkmfmThrrBnLgGYd-FPAk;TCB_SOURCE=wx_devtools;TCB_CONTEXT_KEYS=TCB_ENV,TCB_SEQID,TRIGGER_SRC,TCB_SESSIONTOKEN,TCB_SOURCE;TENCENTCLOUD_SECRETID=AKIDDtm4yzucNcl_lE7IixiQO5aTdd4eBnut0eOk6Br82dnMsx5hg2ZEzBWtxUcUWcjO;TENCENTCLOUD_SECRETKEY=cEh6rsAFJTIeue3REKZQUHdQTTVJKhZmOb1EPLLPhSA=;TENCENTCLOUD_SESSIONTOKEN=DnAZAXuXDmPY87R0UWZMQ4JTIr6SeqpU1eb1faab03564a897dd3fc31dcc3d348GxhExs-XtxXU-g6pm7sXBpGwkJzRcEyYQHnnB6AONAbRfbphlIm-BfGhdXY2RQeEj7UiOWKTw1_VliMk8HIhgNYRZx0Ue6KXiNUneMvX5SgOOOToOCM2-YJTh6oYj1NhoLaefxPRf8TQ72yLWTagRh0x9IaTtpp6jrJFR7lBA26JLgATRnGJRw-iO2HNMCDSSVVT_VnhO46JGGUdEjfBCzs-6uU0jTSlE_Q7EKOt9_4N3a6JfzCxsJQV8IebfZXcTcVqjefiIHZyNGv71-GUbpfHhhfy_EhPlRJsDnvCByiqsM3celEvf86LtIBI-m2Tbae-K069lu5wC3_PFxC_5hjvIiTpfiQW2wEKwlSuklQ;SCF_NAMESPACE=luke-87pns',

            function_version: '$LATEST',

            function_name: 'login',

            namespace: 'luke-87pns'
        }
        const contextObj = tcb.parseContext(mockContext)

        // 验证environ有value含;情形  如a=b;;sfsdf 解析结果为a=b 忽略分号后字符串
        const mockContext1 = {
            memory_limit_in_mb: 256,

            time_limit_in_ms: 3000,

            request_id: '3169444b-25f4-11ea-81e5-525400235f2a',

            environ:
                'a=b;;sfsdf;WX_CLIENTIP=10.12.23.71;WX_CLIENTIPV6=::ffff:10.12.23.71;WX_APPID=wx5ceb4e4809aa1d28;WX_OPENID=oaEk445grItIBpFcJ3eRBCb6yx8g;WX_API_TOKEN=eyJWZXJzaW9uIjoxLCJLZXlWZXJzaW9uIjo4MSwiZXZlbnRJZCI6IkhFeXJYb0hrQjVDLW1OWk1JWkx3N29hNHNoZU9uMEtfNlhuM1FEb2Y0NFV6LVRJRWtyNkZSbUZ3SDhQLWNiS1dETWtyTTZ2Qm1MNXRodjR4SGgycDhXLU1sUzY1Q19uc2FiWmVaTUFpN3c4SktRIiwidGlja2V0IjoiQ0VVU2dBUSsxUzlqWnRHa0ZGenQwTmp4VENCWkM3dHp5M3Vxa252b1pqanFleUY0WEJ1WG1VMElQUGFQZElDYUlkOWxYZGZ5YUxSN3MxR3F3a3NKSEdLb3c2K1FRVGF4cWhZYlJYT3doRWVWYXEya3VGVUxmQWt4TlpKUlFvd2lBNUJsbm8zRDlaOFNZandtRUFtRG1ITitBN3lFRG40Y2NhcHh1OFdjV3N6Tjc3Rkt0WmE2czhadmNTNW9zTmlXcXU5dWRDeEszb05jM3ZuNFdtS2VOcVRqN1BWcWZJUWhMWmhKNmFxbDIvSGdONXhCRkdFaUI1RmtYVEdJUnc0TmxzYTlMUmZ5enp1dDZSazRrVTBUZ3RrOFV3S1dyS1ZKbktoSFg3WEJTSXN1SlF1VDdUL0tzL0JuS1BsM3FNZVdmeGlrKzY1K3VpSTZZb1VyMm9NUlExek11NzVKWVNDaGFGRmxYZWZFeDVBelY1TWF4QUczVHRSL2JhNGhocDZUUjE5ZlNlcVRGTUJjNUh4NXBlUzVWbkVGYWRDdTRZZS9rT0RxZW5xZCtxbnlvYjZNbXFLa0F3VkdXVzRYZ2VVNkZXSnM5Mzl5OFpGRTU1dWpVT0lNWmVDZ1VvNi9Bb201VHFxSXJvK25rK2hCUGh0L1lJVTZMU25INkVVWWtZVXhHZzJKOTBaTDFKZThFN0ZYZzFSQjFyenJGS2NsZEJndVVLWDFxVlBtWExRNndhdWpOcHpneDBNaGZvVENrenhVaWJEdWRqMlAyeG9tNlQ5L3VaM0FON1ZNeEJwckVKTzVQMDZndDV0SElCOXRxK1NPM01pVjluQk03UCtRendhVEJ6eUx6OThGUzBwSVhTdHYyYU9YMzhiZE1FVkpkQkkrUTJ1NW0xWmNENW9kODQ3UnlBPT0ifQ==;WX_CONTEXT_KEYS=WX_CLIENTIP,WX_CLIENTIPV6,WX_APPID,WX_OPENID,WX_API_TOKEN;TCB_ENV=luke-87pns;TCB_SEQID=1577153917182_0.13161529658114857_33555268;TRIGGER_SRC=tcb;TCB_SESSIONTOKEN=pNNA4UPZHja3ngOjkBJbPFCyNvL9twqf0931632f99099b88fdc6ae3e119dc84dsO99eZ7w6rzsbeh4Zf7bDQDns1glEZ761vFBDajV1ijUp-Sj-l59rfLi_s1TdYiA82HjIJzbVKnKEHzuFLJlonOIYd_NFnkQJw4MB0L6vYLcmDYYMzEhrByAddagrSdoxux6vwHfJ4B0tzzajmcXqFKkowDZJn5ZZBX1I-Sta1nfoX73qTCqlUWPAAhkhECa81LSvZrFTfsvZyLOOAvevK_kP5qy2zeYKgQtb9IvHI1xmOSj0AaTIiuqOce5i4_kLu5_Z9Gqqxc1PS2oimkhWRqL79E-sW-fF3HpuGD01W832B2wn9W3vpaKi50lyN2gAyKW3Wf0ASA_vPVyZziR20fkmfmThrrBnLgGYd-FPAk;TCB_SOURCE=wx_devtools;TCB_CONTEXT_KEYS=TCB_ENV,TCB_SEQID,TRIGGER_SRC,TCB_SESSIONTOKEN,TCB_SOURCE;TENCENTCLOUD_SECRETID=AKIDDtm4yzucNcl_lE7IixiQO5aTdd4eBnut0eOk6Br82dnMsx5hg2ZEzBWtxUcUWcjO;TENCENTCLOUD_SECRETKEY=cEh6rsAFJTIeue3REKZQUHdQTTVJKhZmOb1EPLLPhSA=;TENCENTCLOUD_SESSIONTOKEN=DnAZAXuXDmPY87R0UWZMQ4JTIr6SeqpU1eb1faab03564a897dd3fc31dcc3d348GxhExs-XtxXU-g6pm7sXBpGwkJzRcEyYQHnnB6AONAbRfbphlIm-BfGhdXY2RQeEj7UiOWKTw1_VliMk8HIhgNYRZx0Ue6KXiNUneMvX5SgOOOToOCM2-YJTh6oYj1NhoLaefxPRf8TQ72yLWTagRh0x9IaTtpp6jrJFR7lBA26JLgATRnGJRw-iO2HNMCDSSVVT_VnhO46JGGUdEjfBCzs-6uU0jTSlE_Q7EKOt9_4N3a6JfzCxsJQV8IebfZXcTcVqjefiIHZyNGv71-GUbpfHhhfy_EhPlRJsDnvCByiqsM3celEvf86LtIBI-m2Tbae-K069lu5wC3_PFxC_5hjvIiTpfiQW2wEKwlSuklQ;SCF_NAMESPACE=luke-87pns',

            function_version: '$LATEST',

            function_name: 'login',

            namespace: 'luke-87pns'
        }
        const contextObj1 = tcb.parseContext(mockContext1)
        assert(contextObj1.environ.a === 'b')

        // 验证含environment字段，且json字符串为含特殊字符情形
        const mockContext2 = {
            memory_limit_in_mb: 256,

            time_limit_in_ms: 3000,

            request_id: '3169444b-25f4-11ea-81e5-525400235f2a',

            environ:
                'a=b;;sfsdf;WX_CLIENTIP=10.12.23.71;WX_CLIENTIPV6=::ffff:10.12.23.71;WX_APPID=wx5ceb4e4809aa1d28;WX_OPENID=oaEk445grItIBpFcJ3eRBCb6yx8g;WX_API_TOKEN=eyJWZXJzaW9uIjoxLCJLZXlWZXJzaW9uIjo4MSwiZXZlbnRJZCI6IkhFeXJYb0hrQjVDLW1OWk1JWkx3N29hNHNoZU9uMEtfNlhuM1FEb2Y0NFV6LVRJRWtyNkZSbUZ3SDhQLWNiS1dETWtyTTZ2Qm1MNXRodjR4SGgycDhXLU1sUzY1Q19uc2FiWmVaTUFpN3c4SktRIiwidGlja2V0IjoiQ0VVU2dBUSsxUzlqWnRHa0ZGenQwTmp4VENCWkM3dHp5M3Vxa252b1pqanFleUY0WEJ1WG1VMElQUGFQZElDYUlkOWxYZGZ5YUxSN3MxR3F3a3NKSEdLb3c2K1FRVGF4cWhZYlJYT3doRWVWYXEya3VGVUxmQWt4TlpKUlFvd2lBNUJsbm8zRDlaOFNZandtRUFtRG1ITitBN3lFRG40Y2NhcHh1OFdjV3N6Tjc3Rkt0WmE2czhadmNTNW9zTmlXcXU5dWRDeEszb05jM3ZuNFdtS2VOcVRqN1BWcWZJUWhMWmhKNmFxbDIvSGdONXhCRkdFaUI1RmtYVEdJUnc0TmxzYTlMUmZ5enp1dDZSazRrVTBUZ3RrOFV3S1dyS1ZKbktoSFg3WEJTSXN1SlF1VDdUL0tzL0JuS1BsM3FNZVdmeGlrKzY1K3VpSTZZb1VyMm9NUlExek11NzVKWVNDaGFGRmxYZWZFeDVBelY1TWF4QUczVHRSL2JhNGhocDZUUjE5ZlNlcVRGTUJjNUh4NXBlUzVWbkVGYWRDdTRZZS9rT0RxZW5xZCtxbnlvYjZNbXFLa0F3VkdXVzRYZ2VVNkZXSnM5Mzl5OFpGRTU1dWpVT0lNWmVDZ1VvNi9Bb201VHFxSXJvK25rK2hCUGh0L1lJVTZMU25INkVVWWtZVXhHZzJKOTBaTDFKZThFN0ZYZzFSQjFyenJGS2NsZEJndVVLWDFxVlBtWExRNndhdWpOcHpneDBNaGZvVENrenhVaWJEdWRqMlAyeG9tNlQ5L3VaM0FON1ZNeEJwckVKTzVQMDZndDV0SElCOXRxK1NPM01pVjluQk03UCtRendhVEJ6eUx6OThGUzBwSVhTdHYyYU9YMzhiZE1FVkpkQkkrUTJ1NW0xWmNENW9kODQ3UnlBPT0ifQ==;WX_CONTEXT_KEYS=WX_CLIENTIP,WX_CLIENTIPV6,WX_APPID,WX_OPENID,WX_API_TOKEN;TCB_ENV=luke-87pns;TCB_SEQID=1577153917182_0.13161529658114857_33555268;TRIGGER_SRC=tcb;TCB_SESSIONTOKEN=pNNA4UPZHja3ngOjkBJbPFCyNvL9twqf0931632f99099b88fdc6ae3e119dc84dsO99eZ7w6rzsbeh4Zf7bDQDns1glEZ761vFBDajV1ijUp-Sj-l59rfLi_s1TdYiA82HjIJzbVKnKEHzuFLJlonOIYd_NFnkQJw4MB0L6vYLcmDYYMzEhrByAddagrSdoxux6vwHfJ4B0tzzajmcXqFKkowDZJn5ZZBX1I-Sta1nfoX73qTCqlUWPAAhkhECa81LSvZrFTfsvZyLOOAvevK_kP5qy2zeYKgQtb9IvHI1xmOSj0AaTIiuqOce5i4_kLu5_Z9Gqqxc1PS2oimkhWRqL79E-sW-fF3HpuGD01W832B2wn9W3vpaKi50lyN2gAyKW3Wf0ASA_vPVyZziR20fkmfmThrrBnLgGYd-FPAk;TCB_SOURCE=wx_devtools;TCB_CONTEXT_KEYS=TCB_ENV,TCB_SEQID,TRIGGER_SRC,TCB_SESSIONTOKEN,TCB_SOURCE;TENCENTCLOUD_SECRETID=AKIDDtm4yzucNcl_lE7IixiQO5aTdd4eBnut0eOk6Br82dnMsx5hg2ZEzBWtxUcUWcjO;TENCENTCLOUD_SECRETKEY=cEh6rsAFJTIeue3REKZQUHdQTTVJKhZmOb1EPLLPhSA=;TENCENTCLOUD_SESSIONTOKEN=DnAZAXuXDmPY87R0UWZMQ4JTIr6SeqpU1eb1faab03564a897dd3fc31dcc3d348GxhExs-XtxXU-g6pm7sXBpGwkJzRcEyYQHnnB6AONAbRfbphlIm-BfGhdXY2RQeEj7UiOWKTw1_VliMk8HIhgNYRZx0Ue6KXiNUneMvX5SgOOOToOCM2-YJTh6oYj1NhoLaefxPRf8TQ72yLWTagRh0x9IaTtpp6jrJFR7lBA26JLgATRnGJRw-iO2HNMCDSSVVT_VnhO46JGGUdEjfBCzs-6uU0jTSlE_Q7EKOt9_4N3a6JfzCxsJQV8IebfZXcTcVqjefiIHZyNGv71-GUbpfHhhfy_EhPlRJsDnvCByiqsM3celEvf86LtIBI-m2Tbae-K069lu5wC3_PFxC_5hjvIiTpfiQW2wEKwlSuklQ;SCF_NAMESPACE=luke-87pns',

            function_version: '$LATEST',

            function_name: 'login',

            namespace: 'luke-87pns',
            environment: JSON.stringify({ a: 'b;c;fs;d' })
        }

        const contextObj2 = tcb.parseContext(mockContext2)
        assert(contextObj2.environment.a === 'b;c;fs;d')

        // 验证getCloudbaseContext
        const cloudbaseContext = tcb.getCloudbaseContext(mockContext)
        assert(cloudbaseContext.WX_CLIENTIP === '10.12.23.71')

        // 验证parseContext 参数错误
        expect(() => {
            tcb.parseContext('wrong context')
        }).toThrow(new Error('context 必须为对象类型'))

        // 验证envrionment 解析报错
        const mockContext3 = {
            environment: {}
        }

        expect(() => {
            tcb.parseContext(mockContext3)
        }).toThrow(new Error('无效的context对象，请使用 云函数入口的context参数'))
    })

    it('测试 getAuthContext', async () => {
        const app = tcb.init(config)
        const mockContext = {
            environment: JSON.stringify({
                TCB_UUID: 'uuid',
                LOGINTYPE: 'QQ-MINI',
                QQ_OPENID: 'QQ_OPENID',
                QQ_APPID: 'QQ_APPID'
            })
        }

        const authContextRes = await app.auth().getAuthContext(mockContext)
        assert.deepStrictEqual(authContextRes, {
            uid: 'uuid',
            loginType: 'QQ-MINI',
            appId: 'QQ_APPID',
            openId: 'QQ_OPENID'
        })
    })
})
