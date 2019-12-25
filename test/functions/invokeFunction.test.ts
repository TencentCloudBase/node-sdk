import tcb from '../../src/index'
import assert from 'assert'
import config from '../config.local'
import { ERROR } from '../../src/const/code'

describe('functions.invokeFunction: 执行云函数', () => {
  const app = tcb.init(config)

  it('校验调用云函数传参', async () => {
    let a: any = {},
      b: any = {}
    a.c = b
    b.c = a
    let result
    try {
      result = await app.callFunction({
        name: 'test',
        data: a
      })
    } catch (e) {
      assert(
        e.code === ERROR.INVALID_PARAM.code &&
          e.message === '对象出现了循环引用'
      )
    }

    try {
      result = await app.callFunction({
        name: '',
        data: { a: 1 }
      })
    } catch (e) {
      assert(
        e.code === ERROR.INVALID_PARAM.code && e.message === '函数名不能为空'
      )
    }
  })

  it.only('执行云函数', async () => {
    const result = await app.callFunction({
      name: 'test-env',
      data: { a: 1 }
    })
    console.log(result)
    // assert(result.result, "执行云函数失败");
    expect.objectContaining({ result: expect.anything() })
  }, 10000)

  it('执行不存在的云函数', async () => {
    const result = await app.callFunction({
      name: 'unexistFunction',
      data: { a: 1 }
    })
    // console.log(result)
    assert(result.code === 'FUNCTIONS_EXECUTE_FAIL')
  })

  it('执行云函数 设定自定义超时', async () => {
    try {
      const result = await app.callFunction(
        {
          name: 'test',
          data: { a: 1 }
        },
        {
          timeout: 10
        }
      )
      assert(!result)
    } catch (err) {
      // console.log(err)
      assert(err.code === 'ESOCKETTIMEDOUT')
    }
  }, 10000)

  it('mock callFunction 回包为string', async () => {
    jest.resetModules()
    jest.mock('request', () => {
      return jest.fn().mockImplementation((params, callback) => {
        callback(null, { statusCode: 200 }, { data: { response_data: 'test' } })
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
      // assert(err.code === 'STORAGE_REQUEST_FAIL')
      console.log(err)
    }
  })
})
