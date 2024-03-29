import tcb from '../../src/index'
import assert, { rejects } from 'assert'
import config from '../config.local'
import { SYMBOL_CURRENT_ENV } from '../../src/const/symbol'
import { create } from 'domain'

const app = tcb.init({
    ...config,
    credentials: {
        private_key_id: 'da86590d-dd17-45bd-84df-433f05612d0a',
        private_key:
            '-----BEGIN RSA PRIVATE KEY-----\nMIICXAIBAAKBgQDNo9vk/GFDkihEJv5SbN4zQKW9OAjf4C2Z13eGYxLYIYhwNDi5\nl2O5+NLpPzH4Q839ULJIYQ6hfBAVO7mvQ+WP2oYeIqQyRe9NkDlCLmJ10SDwGQRq\nqekVHbz+2fIugxJf3BqIDX3nSHC4TkZZldSgZJIBwIUI5h0t2/IqEjFaHwIDAQAB\nAoGBALdRZrrIPhDVn2258Sgbgy3faKC47jhdiWlGinfTpD3mDtIvy42vJqjn52Uk\n/+/Yyi4THQum8jsE9PVoy8wxU9eDJN4AVjNf8Y98a/z8FCEVyXsvUPp4+Y9pPSmd\nmZe6JKU3mDTXtQDMrtZlkSHVGhSCo/vLMccrAdus8DEnWD0BAkEA2scDuCx9qb4A\nHs8t2j1jL483lsTT8dV8bX5UCwIpOP8jCgQmBbxIyL3/IIwonS7eRSeUDhh2aim+\ng2uhxqSygQJBAPCgo9jOQ/uwy2YjSOE3r6Q1gDCfclvY9z2Xb2IH0AZg529l2rg2\nqh3PPFEB7dBxzNimu9rhDG+dre61ilNwfJ8CQFrCfTSGoIsum3YslOUY2nD8hR8z\nAIou+rOh2NPITbmrfqnFFtECT1+YEqM6Ag9TRjqCNNW0KEvajYKPwElcQgECQHQj\nJFGM5FUDNHh8iT1iUhywUcml+10HL/WDNJgc6zNY6/rhLxqAD8VJc3QpuS1E77iV\naM+wlP7+HKe86SFyhkMCQFWmIveCeb0U0MTHV+Uem1vYWu5gLwSRvvvQlBiTx8Nb\ngLo8C8GxW6uCVPxk4gqnvwVSIN8sBfxQksHMOU3zQYo=\n-----END RSA PRIVATE KEY-----\n'
        // env_id: 'luke-87pns'
    }
})

describe('auth 不注入环境变量', () => {
    it('校验uid', async () => {
        let uid
        try {
            uid = 1
            app.auth().createTicket(uid)
        } catch (e) {
            assert(e.message === 'uid must be a string')
        }

        try {
            uid = '1'
            app.auth().createTicket(uid)
        } catch (e) {
            assert(e.message === `Invalid uid: "${uid}"`)
        }
    })
})

describe('auth 注入环境变量', () => {
    // it('生成登录ticket', async () => {
    //     const result = app.auth().createTicket('oyeju0Eoc1ZCEgyxfk2vNeYDMpRs', {
    //         refresh: 5000
    //     })
    //     assert(result)
    // }, 30000)

    // it('生成登录ticket 不传refresh', async () => {
    //     const result = app.auth().createTicket('oyeju0Eoc1ZCEgyxfk2vNeYDMpRs')
    //     assert(result)
    // }, 30000)

    it('不注入环境变量 默认取空字符串', async () => {
        process.env.WX_OPENID = ''
        process.env.WX_APPID = ''
        process.env.TCB_UUID = ''
        process.env.TCB_CUSTOM_USER_ID = ''
        process.env.TCB_SOURCE_IP = ''

        assert.deepStrictEqual(app.auth().getUserInfo(), {
            openId: '',
            appId: '',
            uid: '',
            customUserId: '',
            isAnonymous: false
        })
        assert.deepStrictEqual(app.auth().getClientIP(), '')

        assert.deepStrictEqual(app.auth().getEndUserInfo(), {
            userInfo: {
                openId: '',
                appId: '',
                uid: '',
                customUserId: '',
                isAnonymous: false
            }
        })
    })

    it('mock getEndUserInfo return code', async () => {
        jest.resetModules()
        jest.mock('request', () => {
            return jest.fn().mockImplementation((params, callback) => {
                const body = { code: 'mockCode', message: 'mockMessage' }
                process.nextTick(() => {
                    callback(null, { req: { reusedSocket: false }, statusCode: 200, body })
                })
            })
        })

        const tcb1 = require('../../src/index')

        const app1 = tcb1.init({
            ...config,
            credentials: {
                private_key_id: 'da86590d-dd17-45bd-84df-433f05612d0a',
                private_key:
                    '-----BEGIN RSA PRIVATE KEY-----\nMIICXAIBAAKBgQDNo9vk/GFDkihEJv5SbN4zQKW9OAjf4C2Z13eGYxLYIYhwNDi5\nl2O5+NLpPzH4Q839ULJIYQ6hfBAVO7mvQ+WP2oYeIqQyRe9NkDlCLmJ10SDwGQRq\nqekVHbz+2fIugxJf3BqIDX3nSHC4TkZZldSgZJIBwIUI5h0t2/IqEjFaHwIDAQAB\nAoGBALdRZrrIPhDVn2258Sgbgy3faKC47jhdiWlGinfTpD3mDtIvy42vJqjn52Uk\n/+/Yyi4THQum8jsE9PVoy8wxU9eDJN4AVjNf8Y98a/z8FCEVyXsvUPp4+Y9pPSmd\nmZe6JKU3mDTXtQDMrtZlkSHVGhSCo/vLMccrAdus8DEnWD0BAkEA2scDuCx9qb4A\nHs8t2j1jL483lsTT8dV8bX5UCwIpOP8jCgQmBbxIyL3/IIwonS7eRSeUDhh2aim+\ng2uhxqSygQJBAPCgo9jOQ/uwy2YjSOE3r6Q1gDCfclvY9z2Xb2IH0AZg529l2rg2\nqh3PPFEB7dBxzNimu9rhDG+dre61ilNwfJ8CQFrCfTSGoIsum3YslOUY2nD8hR8z\nAIou+rOh2NPITbmrfqnFFtECT1+YEqM6Ag9TRjqCNNW0KEvajYKPwElcQgECQHQj\nJFGM5FUDNHh8iT1iUhywUcml+10HL/WDNJgc6zNY6/rhLxqAD8VJc3QpuS1E77iV\naM+wlP7+HKe86SFyhkMCQFWmIveCeb0U0MTHV+Uem1vYWu5gLwSRvvvQlBiTx8Nb\ngLo8C8GxW6uCVPxk4gqnvwVSIN8sBfxQksHMOU3zQYo=\n-----END RSA PRIVATE KEY-----\n'
            }
        })

        expect(app1.auth().getEndUserInfo('c7446481324445a0bca211d747281ca3')).rejects.toThrow(
            new Error('mockMessage')
        )

        const app2 = tcb1.init({
            ...config,
            credentials: {
                private_key_id: 'da86590d-dd17-45bd-84df-433f05612d0a',
                private_key:
                    '-----BEGIN RSA PRIVATE KEY-----\nMIICXAIBAAKBgQDNo9vk/GFDkihEJv5SbN4zQKW9OAjf4C2Z13eGYxLYIYhwNDi5\nl2O5+NLpPzH4Q839ULJIYQ6hfBAVO7mvQ+WP2oYeIqQyRe9NkDlCLmJ10SDwGQRq\nqekVHbz+2fIugxJf3BqIDX3nSHC4TkZZldSgZJIBwIUI5h0t2/IqEjFaHwIDAQAB\nAoGBALdRZrrIPhDVn2258Sgbgy3faKC47jhdiWlGinfTpD3mDtIvy42vJqjn52Uk\n/+/Yyi4THQum8jsE9PVoy8wxU9eDJN4AVjNf8Y98a/z8FCEVyXsvUPp4+Y9pPSmd\nmZe6JKU3mDTXtQDMrtZlkSHVGhSCo/vLMccrAdus8DEnWD0BAkEA2scDuCx9qb4A\nHs8t2j1jL483lsTT8dV8bX5UCwIpOP8jCgQmBbxIyL3/IIwonS7eRSeUDhh2aim+\ng2uhxqSygQJBAPCgo9jOQ/uwy2YjSOE3r6Q1gDCfclvY9z2Xb2IH0AZg529l2rg2\nqh3PPFEB7dBxzNimu9rhDG+dre61ilNwfJ8CQFrCfTSGoIsum3YslOUY2nD8hR8z\nAIou+rOh2NPITbmrfqnFFtECT1+YEqM6Ag9TRjqCNNW0KEvajYKPwElcQgECQHQj\nJFGM5FUDNHh8iT1iUhywUcml+10HL/WDNJgc6zNY6/rhLxqAD8VJc3QpuS1E77iV\naM+wlP7+HKe86SFyhkMCQFWmIveCeb0U0MTHV+Uem1vYWu5gLwSRvvvQlBiTx8Nb\ngLo8C8GxW6uCVPxk4gqnvwVSIN8sBfxQksHMOU3zQYo=\n-----END RSA PRIVATE KEY-----\n'
            },
            throwOnCode: false
        })

        const res = await app2.auth().getEndUserInfo('c7446481324445a0bca211d747281ca3')
        assert.ok(res.code === 'mockCode')
    })

    it.skip('mock auth.getUserInfoForAdmin 接口，不存在的用户按匿名返回', async () => {

        const uid = 'luke123invalid'
        const userInfo = await app.auth().getEndUserInfo(uid)
        expect(userInfo.userInfo.uid === uid)
    })

    it('获取用户信息getUserInfo 不传入uid', () => {
        process.env.WX_OPENID = 'WX_OPENID'
        process.env.WX_APPID = 'WX_APPID'
        process.env.TCB_UUID = 'TCB_UUID'
        process.env.TCB_CUSTOM_USER_ID = 'TCB_CUSTOM_USER_ID'
        process.env.TCB_ISANONYMOUS_USER = 'true'
        process.env.TCB_CONTEXT_KEYS = 'TCB_UUID,TCB_CUSTOM_USER_ID,TCB_ISANONYMOUS_USER'
        process.env.WX_CONTEXT_KEYS = 'WX_OPENID,WX_APPID'

        assert.deepStrictEqual(app.auth().getUserInfo(), {
            openId: 'WX_OPENID',
            appId: 'WX_APPID',
            uid: 'TCB_UUID',
            customUserId: 'TCB_CUSTOM_USER_ID',
            isAnonymous: true
        })
    })

    it('获取云开发用户信息 getEndUserInfo 传入uid', async () => {
        try {
            const { userInfo } = await app.auth().getEndUserInfo('c7446481324445a0bca211d747281ca3')
            const keysAreValid = [
                'openId',
                'appId',
                'uid',
                'customUserId',
                'isAnonymous',
                'envName',
                'nickName',
                'gender',
                'country',
                'province',
                'city',
                'avatarUrl',
                'uuid',
                'wxOpenid',
                'wxOpenId',
                'wxUnionId',
                'wxPublicId',
                'qqMiniOpenId',
                'email',
                'hasPassword',
                'username',
                'createTime',
                'updateTime'
            ].every(key => userInfo.hasOwnProperty(key))

            assert.ok(keysAreValid)
        } catch (error) {
            assert.ok(error instanceof Error)
        }
    })

    it.skip('测试 queryUserInfo', async () => {
        const userInfo = await app.auth().queryUserInfo({
            platform: 'PHONE',
            platformId: '+8618202741638'
        })
        console.log('userInfo', userInfo)
    })

    it('获取客户端IP', async () => {
        process.env.TCB_SOURCE_IP = 'TCB_SOURCE_IP'
        process.env.TCB_CONTEXT_KEYS = 'TCB_SOURCE_IP'

        assert.deepStrictEqual(app.auth().getClientIP(), 'TCB_SOURCE_IP')
    })

    it('校验createTicket 时，init config 不含 env', async () => {
        const app1 = tcb.init({
            ...config,
            credentials: {
                private_key_id: 'da86590d-dd17-45bd-84df-433f05612d0a',
                private_key:
                    '-----BEGIN RSA PRIVATE KEY-----\nMIICXAIBAAKBgQDNo9vk/GFDkihEJv5SbN4zQKW9OAjf4C2Z13eGYxLYIYhwNDi5\nl2O5+NLpPzH4Q839ULJIYQ6hfBAVO7mvQ+WP2oYeIqQyRe9NkDlCLmJ10SDwGQRq\nqekVHbz+2fIugxJf3BqIDX3nSHC4TkZZldSgZJIBwIUI5h0t2/IqEjFaHwIDAQAB\nAoGBALdRZrrIPhDVn2258Sgbgy3faKC47jhdiWlGinfTpD3mDtIvy42vJqjn52Uk\n/+/Yyi4THQum8jsE9PVoy8wxU9eDJN4AVjNf8Y98a/z8FCEVyXsvUPp4+Y9pPSmd\nmZe6JKU3mDTXtQDMrtZlkSHVGhSCo/vLMccrAdus8DEnWD0BAkEA2scDuCx9qb4A\nHs8t2j1jL483lsTT8dV8bX5UCwIpOP8jCgQmBbxIyL3/IIwonS7eRSeUDhh2aim+\ng2uhxqSygQJBAPCgo9jOQ/uwy2YjSOE3r6Q1gDCfclvY9z2Xb2IH0AZg529l2rg2\nqh3PPFEB7dBxzNimu9rhDG+dre61ilNwfJ8CQFrCfTSGoIsum3YslOUY2nD8hR8z\nAIou+rOh2NPITbmrfqnFFtECT1+YEqM6Ag9TRjqCNNW0KEvajYKPwElcQgECQHQj\nJFGM5FUDNHh8iT1iUhywUcml+10HL/WDNJgc6zNY6/rhLxqAD8VJc3QpuS1E77iV\naM+wlP7+HKe86SFyhkMCQFWmIveCeb0U0MTHV+Uem1vYWu5gLwSRvvvQlBiTx8Nb\ngLo8C8GxW6uCVPxk4gqnvwVSIN8sBfxQksHMOU3zQYo=\n-----END RSA PRIVATE KEY-----\n'
                // env_id: 'luke-87pns'
            },
            env: ''
        })
        expect(() => {
            app1.auth().createTicket('luke123')
        }).toThrow(new Error('no env in config'))
    })

    it('校验createTicket时，init config 为 symbol_current_env', async () => {
        process.env.SCF_NAMESPACE = 'luke-87pns'

        const app1 = tcb.init({
            ...config,
            credentials: {
                private_key_id: 'da86590d-dd17-45bd-84df-433f05612d0a',
                private_key:
                    '-----BEGIN RSA PRIVATE KEY-----\nMIICXAIBAAKBgQDNo9vk/GFDkihEJv5SbN4zQKW9OAjf4C2Z13eGYxLYIYhwNDi5\nl2O5+NLpPzH4Q839ULJIYQ6hfBAVO7mvQ+WP2oYeIqQyRe9NkDlCLmJ10SDwGQRq\nqekVHbz+2fIugxJf3BqIDX3nSHC4TkZZldSgZJIBwIUI5h0t2/IqEjFaHwIDAQAB\nAoGBALdRZrrIPhDVn2258Sgbgy3faKC47jhdiWlGinfTpD3mDtIvy42vJqjn52Uk\n/+/Yyi4THQum8jsE9PVoy8wxU9eDJN4AVjNf8Y98a/z8FCEVyXsvUPp4+Y9pPSmd\nmZe6JKU3mDTXtQDMrtZlkSHVGhSCo/vLMccrAdus8DEnWD0BAkEA2scDuCx9qb4A\nHs8t2j1jL483lsTT8dV8bX5UCwIpOP8jCgQmBbxIyL3/IIwonS7eRSeUDhh2aim+\ng2uhxqSygQJBAPCgo9jOQ/uwy2YjSOE3r6Q1gDCfclvY9z2Xb2IH0AZg529l2rg2\nqh3PPFEB7dBxzNimu9rhDG+dre61ilNwfJ8CQFrCfTSGoIsum3YslOUY2nD8hR8z\nAIou+rOh2NPITbmrfqnFFtECT1+YEqM6Ag9TRjqCNNW0KEvajYKPwElcQgECQHQj\nJFGM5FUDNHh8iT1iUhywUcml+10HL/WDNJgc6zNY6/rhLxqAD8VJc3QpuS1E77iV\naM+wlP7+HKe86SFyhkMCQFWmIveCeb0U0MTHV+Uem1vYWu5gLwSRvvvQlBiTx8Nb\ngLo8C8GxW6uCVPxk4gqnvwVSIN8sBfxQksHMOU3zQYo=\n-----END RSA PRIVATE KEY-----\n',
                env_id: 'luke-87pns'
            },
            env: SYMBOL_CURRENT_ENV
        })

        const createTicketRes = app1.auth().createTicket('luke123')
        assert.ok(typeof createTicketRes === 'string')
        process.env.TCB_ENV = ''
    })

    it('校验credentials 不含env', async () => {
        let result
        try {
            result = app.auth().createTicket('oyeju0Eoc1ZCEgyxfk2vNeYDMpRs')
        } catch (e) {
            assert(e.code === 'INVALID_PARAM')
        }
    })
    it('校验credentials 含 env 且 与 init env不一致', async () => {
        const app1 = tcb.init({
            ...config,
            credentials: {
                private_key_id: 'da86590d-dd17-45bd-84df-433f05612d0a',
                private_key:
                    '-----BEGIN RSA PRIVATE KEY-----\nMIICXAIBAAKBgQDNo9vk/GFDkihEJv5SbN4zQKW9OAjf4C2Z13eGYxLYIYhwNDi5\nl2O5+NLpPzH4Q839ULJIYQ6hfBAVO7mvQ+WP2oYeIqQyRe9NkDlCLmJ10SDwGQRq\nqekVHbz+2fIugxJf3BqIDX3nSHC4TkZZldSgZJIBwIUI5h0t2/IqEjFaHwIDAQAB\nAoGBALdRZrrIPhDVn2258Sgbgy3faKC47jhdiWlGinfTpD3mDtIvy42vJqjn52Uk\n/+/Yyi4THQum8jsE9PVoy8wxU9eDJN4AVjNf8Y98a/z8FCEVyXsvUPp4+Y9pPSmd\nmZe6JKU3mDTXtQDMrtZlkSHVGhSCo/vLMccrAdus8DEnWD0BAkEA2scDuCx9qb4A\nHs8t2j1jL483lsTT8dV8bX5UCwIpOP8jCgQmBbxIyL3/IIwonS7eRSeUDhh2aim+\ng2uhxqSygQJBAPCgo9jOQ/uwy2YjSOE3r6Q1gDCfclvY9z2Xb2IH0AZg529l2rg2\nqh3PPFEB7dBxzNimu9rhDG+dre61ilNwfJ8CQFrCfTSGoIsum3YslOUY2nD8hR8z\nAIou+rOh2NPITbmrfqnFFtECT1+YEqM6Ag9TRjqCNNW0KEvajYKPwElcQgECQHQj\nJFGM5FUDNHh8iT1iUhywUcml+10HL/WDNJgc6zNY6/rhLxqAD8VJc3QpuS1E77iV\naM+wlP7+HKe86SFyhkMCQFWmIveCeb0U0MTHV+Uem1vYWu5gLwSRvvvQlBiTx8Nb\ngLo8C8GxW6uCVPxk4gqnvwVSIN8sBfxQksHMOU3zQYo=\n-----END RSA PRIVATE KEY-----\n',
                // env_id: 'luke-87pns'
                env_id: 'luketest-0nmm1'
            }
        })
        let result
        try {
            result = app1.auth().createTicket('oyeju0Eoc1ZCEgyxfk2vNeYDMpRs')
        } catch (e) {
            assert(e.code === 'INVALID_PARAM')
        }
    })

    it('校验credentials 含 env 且 与 init env 一致', async () => {
        const app1 = tcb.init({
            ...config,
            credentials: {
                private_key_id: 'da86590d-dd17-45bd-84df-433f05612d0a',
                private_key:
                    '-----BEGIN RSA PRIVATE KEY-----\nMIICXAIBAAKBgQDNo9vk/GFDkihEJv5SbN4zQKW9OAjf4C2Z13eGYxLYIYhwNDi5\nl2O5+NLpPzH4Q839ULJIYQ6hfBAVO7mvQ+WP2oYeIqQyRe9NkDlCLmJ10SDwGQRq\nqekVHbz+2fIugxJf3BqIDX3nSHC4TkZZldSgZJIBwIUI5h0t2/IqEjFaHwIDAQAB\nAoGBALdRZrrIPhDVn2258Sgbgy3faKC47jhdiWlGinfTpD3mDtIvy42vJqjn52Uk\n/+/Yyi4THQum8jsE9PVoy8wxU9eDJN4AVjNf8Y98a/z8FCEVyXsvUPp4+Y9pPSmd\nmZe6JKU3mDTXtQDMrtZlkSHVGhSCo/vLMccrAdus8DEnWD0BAkEA2scDuCx9qb4A\nHs8t2j1jL483lsTT8dV8bX5UCwIpOP8jCgQmBbxIyL3/IIwonS7eRSeUDhh2aim+\ng2uhxqSygQJBAPCgo9jOQ/uwy2YjSOE3r6Q1gDCfclvY9z2Xb2IH0AZg529l2rg2\nqh3PPFEB7dBxzNimu9rhDG+dre61ilNwfJ8CQFrCfTSGoIsum3YslOUY2nD8hR8z\nAIou+rOh2NPITbmrfqnFFtECT1+YEqM6Ag9TRjqCNNW0KEvajYKPwElcQgECQHQj\nJFGM5FUDNHh8iT1iUhywUcml+10HL/WDNJgc6zNY6/rhLxqAD8VJc3QpuS1E77iV\naM+wlP7+HKe86SFyhkMCQFWmIveCeb0U0MTHV+Uem1vYWu5gLwSRvvvQlBiTx8Nb\ngLo8C8GxW6uCVPxk4gqnvwVSIN8sBfxQksHMOU3zQYo=\n-----END RSA PRIVATE KEY-----\n',
                env_id: 'luke-87pns'
            }
        })
        let result = app1.auth().createTicket('oyeju0Eoc1ZCEgyxfk2vNeYDMpRs')
        // console.log(result)
        assert(result)
    })
})
