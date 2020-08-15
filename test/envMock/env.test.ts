// import CloudBase from '@cloudbase/manager-node'
import tcb from '../../lib/index'
import assert from 'assert'
import config from '../config.local'

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
}

describe('mock 云函数环境', () => {
    // const app = tcb.init(config)
    // console.log(path.join(__dirname, '/case/'))

    // it('创建云函数', async () => {
    //   // 检查同名云函数是否存在，存在则更新 不存在则创建
    //   const detail = await functions.getFunctionDetail('luke-case')
    //   if(detail && detail.FunctionName === 'luke-case') {
    //     const updateRes = await functions.updateFunctionCode({
    //       name: 'luke-case',
    //       config:{
    //         runtime: 'Nodejs8.9'
    //       }
    //     },
    //     path.join(__dirname, '/case/'),
    //     ''
    //     )
    //     assert(updateRes.RequestId)
    //   } else {
    //     const res = await functions.createFunction({
    //       name: 'luke-case',
    //       config: {
    //         timeout: 20,
    //         envVariables: {},
    //         runtime: 'Nodejs8.9'
    //       }
    //     },
    //     path.join(__dirname, '/case/'),
    //     true,
    //     '')
    //     assert(res === undefined)
    //   }
    // }, 30000)
    it('验证 symbol', async () => {
        let newConfig = {
            ...config,
            env: tcb.SYMBOL_CURRENT_ENV
        }

        const app = tcb.init(newConfig)
        const testEnv = 'luketest-0nmm1'
        // const testEnv = ''
        process.env.TCB_CONTEXT_KEYS = 'TCB_ENV' // 模拟云函数内keys变量
        process.env.TCB_ENV = testEnv
        const res = await app.callFunction({
            name: 'testTCBENV',
            data: { a: 1 }
        })
        // console.log(res)
        assert(res.result === testEnv)
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
        jest.resetModules()
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
        jest.mock('../../lib/utils/request', () => {
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

        const tcb1 = require('../../lib/index')
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
        assert(checkRes.url.indexOf('http://tcb-admin.tencentyun.com') === 0)
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

        // let dbResult2 = await db
        //     .collection('coll-1')
        //     .where({})
        //     .get()
        // assert(result2.result.body.envName === 'testEnv')
        // assert(dbResult2.data[0].body.envName === 'testDbEnv')

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
