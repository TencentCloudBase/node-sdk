// import CloudBase from '@cloudbase/manager-node'
import tcb from '../../src/index'
import assert from 'assert'
import config from '../config.local'
import url from 'url'

function setEnvValue() {
    process.env.TENCENTCLOUD_RUNENV = 'SCF'
    process.env._SCF_TCB_LOG = '1'
    process.env.TCB_ENV = 'MOCK_TCB_ENV'
    process.env.SCF_NAMESPACE = 'MOCK_SCF_NAMESPACE'
    process.env.TCB_SEQID = 'MOCK_TCB_SEQID'
    process.env.TENCENTCLOUD_SECRETID = 'MOCK_TENCENTCLOUD_SECRETID'
    process.env.TENCENTCLOUD_SECRETKEY = 'MOCK_TENCENTCLOUD_SECRETKEY'
    process.env.TENCENTCLOUD_SESSIONTOKEN = 'MOCK_TENCENTCLOUD_SESSIONTOKEN'
    process.env.TCB_SOURCE = 'MOCK_TCB_SOURCE'
    process.env.TCB_CONTEXT_KEYS = 'TCB_ENV,TCB_SEQID,TCB_SOURCE'
    process.env.TCB_CONTEXT_CNFG = ''
}

function resetEnvValue() {
    process.env.TENCENTCLOUD_RUNENV = ''
    process.env._SCF_TCB_LOG = ''
    process.env.TCB_ENV = ''
    process.env.SCF_NAMESPACE = ''
    process.env.TCB_SEQID = ''
    process.env.TENCENTCLOUD_SECRETID = ''
    process.env.TENCENTCLOUD_SECRETKEY = ''
    process.env.TENCENTCLOUD_SESSIONTOKEN = ''
    process.env.TCB_SOURCE = ''
    process.env.TCB_CONTEXT_KEYS = 'TCB_ENV,TCB_SEQID,TCB_SOURCE'
    process.env.TCB_CONTEXT_CNFG = ''
}

beforeEach(async () => {
    jest.resetModules()
    jest.resetAllMocks()
})

describe('mock 云函数环境', () => {
    it('验证 symbol', async () => {
        let newConfig = {
            ...config,
            env: tcb.SYMBOL_CURRENT_ENV
        }

        const app = tcb.init(newConfig)
        const testEnv = 'luke-prepay-test-8fjmkkf8fd6814b'
        // const testEnv = ''
        process.env.TCB_CONTEXT_KEYS = 'TCB_ENV' // 模拟云函数内keys变量
        process.env.TCB_ENV = testEnv
        const res = await app.callFunction({
            name: 'testTCBENV',
            data: { a: 1 }
        })

        console.log('res:', res)

        // console.log(res)
        assert(res.result === testEnv)
    })

    it('验证 TCB_CONTEXT_CNFG', async () => {
        jest.mock('../../src/utils/request', () => {
            return {
                extraRequest: jest.fn().mockImplementation(opts => {
                    return Promise.resolve({
                        statusCode: 200,
                        body: {
                            data: { response_data: opts },
                            requestId: 'testRequestId'
                        }
                    })
                })
            }
        })
        setEnvValue()

        process.env.TCB_CONTEXT_CNFG = JSON.stringify({ URL: 'https://testurl' })
        const tcb = require('../../src/index')
        const app = tcb.init(config)
        // mock一次http请求
        let mockReqRes = await app.callFunction({
            name: 'unexistFunction',
            data: { a: 1 }
        })

        let reqOpts = mockReqRes.result
        const myURL = url.parse(reqOpts.url)
        assert(myURL.hostname === 'testurl')
        resetEnvValue()
    })

    it('验证 init环境变量  请求时未取到值', async () => {
        process.env.TCB_ENV = ''
        let newConfig = {
            ...config,
            env: tcb.SYMBOL_CURRENT_ENV
        }

        const app = tcb.init(newConfig)

        try {
            await app.callFunction({
                name: 'testTCBENV',
                data: { a: 1 }
            })
        } catch (e) {
            // console.log(e)
            assert(e.code === 'INVALID_PARAM')
        }

        newConfig = {
            ...newConfig,
            throwOnCode: false
        }

        const app1 = tcb.init(newConfig)
        const res = await app1.callFunction({
            name: 'testTCBENV',
            data: { a: 1 }
        })
        assert(res.code === 'INVALID_PARAM')
    })

    it('注入mock 云函数环境变量', async () => {
        setEnvValue()

        // 验证环境变量相关逻辑
        let app = tcb.init(config)

        // 1. _SCF_TCB_LOG(日志)
        assert(process.env._SCF_TCB_LOG == '1' && app.logger().isSupportClsReport == false)
        app.logger().log({ a: 1 })

        // mock support
        ;(<any>console).__baseLog__ = console.log
        app = tcb.init(config)
        assert(process.env._SCF_TCB_LOG == '1' && app.logger().isSupportClsReport === true)
        app.logger().log({ a: 1 })
        app.logger().info({ a: 1 })
        app.logger().error({ a: 1 })
        app.logger().warn({ a: 1 })

        // 2. TENCENTCLOUD_SECRETID TENCENTCLOUD_SECRETKEY TENCENTCLOUD_SESSIONTOKEN TENCENTCLOUD_RUNENV
        jest.mock('../../src/utils/request', () => {
            return {
                extraRequest: jest.fn().mockImplementation(opts => {
                    let mockRes = null
                    if (opts.body.action === 'functions.invokeFunction') {
                        mockRes = {
                            statusCode: 200,
                            body: {
                                data: { response_data: opts },
                                requestId: 'testRequestId'
                            }
                        }
                    }
                    if (opts.body.action === 'database.getDocument') {
                        mockRes = {
                            statusCode: 200,
                            body: {
                                data: { data: { list: [opts] } },
                                requestId: 'testRequestId'
                            }
                        }
                    }
                    return Promise.resolve(mockRes)
                })
            }
        })

        const tcb1 = require('../../src/index')
        const app1 = tcb1.init({ env: tcb1.SYMBOL_CURRENT_ENV })

        const appWithNoEnv = tcb1.init()

        let result = await app1.callFunction({
            name: 'test',
            data: { a: 1 }
        })

        let result1 = await appWithNoEnv.callFunction({
            name: 'test',
            data: { a: 1 }
        })

        const checkRes = result.result
        const checkRes1 = result1.result

        // scf url
        assert(
            checkRes.url.indexOf('http://MOCK_TCB_ENV.internal.tcb-api.tencentcloudapi.com') === 0
        )
        // tcb-source
        assert(checkRes.headers['x-tcb-source'].indexOf('MOCK_TCB_SOURCE') >= 0)
        // seqId
        assert(checkRes.url.indexOf('MOCK_TCB_SEQID') >= 0)
        // secretId
        // assert(checkRes.body.authorization.indexOf('MOCK_TENCENTCLOUD_SECRETID') >= 0)
        // sessionToken
        assert(checkRes.body.sessionToken === 'MOCK_TENCENTCLOUD_SESSIONTOKEN')
        // env
        assert(checkRes.body.envName === 'MOCK_TCB_ENV')

        // 验证不传env，请求参数中不含envName
        assert(checkRes1.body.envName === undefined)

        // 3. 验证env 设置 database(env) > init(env)
        const app2 = tcb1.init({ env: 'testEnv' })
        const db = app2.database({ env: 'testDbEnv' })

        let result2 = await app2.callFunction({
            name: 'test',
            data: { a: 1 }
        })

        // mock scf环境中无secretId或secretKey
        process.env.TENCENTCLOUD_SECRETID = ''
        const app4 = tcb.init()
        try {
            await app4.callFunction({
                name: 'test',
                data: { a: 1 }
            })
        } catch (err) {
            assert(
                err.code === 'INVALID_PARAM' &&
                    err.message === 'missing authoration key, redeploy the function'
            )
        }

        resetEnvValue()
    })

    it('模拟注入环境密钥', async () => {
        process.env.TENCENTCLOUD_SECRETID = config.secretId
        process.env.TENCENTCLOUD_SECRETKEY = config.secretKey

        //
        const app = tcb.init({
            env: config.env
        })

        let result = await app.callFunction({
            name: 'test',
            data: { a: 1 }
        })

        delete process.env.TENCENTCLOUD_SECRETID
        delete process.env.TENCENTCLOUD_SECRETKEY

        assert(result.requestId)
    })
})
