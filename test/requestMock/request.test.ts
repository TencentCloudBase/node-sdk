import assert from 'assert'
import config from '../config.local'

describe('mock request 回包处理逻辑', () => {
    it('mock callFunction 回包为string', async () => {
        jest.resetModules()
        jest.mock('request', () => {
            return jest.fn().mockImplementation((params, callback) => {
                console.log('debug')

                callback(
                    null,
                    { statusCode: 200, body: JSON.stringify({ data: { response_data: 'test' } }) },
                    JSON.stringify({ data: { response_data: 'test' } })
                )
            })
        })

        const tcb1 = require('../../src/index')
        const app1 = tcb1.init(config)
        try {
            let result = await app1.callFunction({
                name: 'unexistFunction',
                data: { a: 1 }
            })
            // console.log(result)
            assert(typeof result.result === 'string')
        } catch (err) {
            console.log('err:', err)
        }
    })

    it('mock request statusCode!==200', async () => {
        jest.resetModules()
        jest.mock('request', () => {
            return jest.fn().mockImplementation((params, callback) => {
                callback(null, { statusCode: 400 }, null)
            })
        })

        const tcb1 = require('../../src/index')
        const app1 = tcb1.init(config)
        try {
            await app1.callFunction({
                name: 'unexistFunction',
                data: { a: 1 }
            })
        } catch (err) {
            assert(err.code === 400)
        }
    })
})
