// 校验各种设置config ，入参是否正确

import tcb from '../../src/index'
import assert from 'assert'
import config from '../config.local'
import {ERROR} from '../../src/const/code'

beforeEach(async () => {
  jest.resetModules()
  jest.resetAllMocks()
})

// TODO 删除前先创建
describe('校验config设置  请求入参', () => {
  // const app = tcb.init(config)

  it('校验config.isHttp => protocol', async() => {
    config.isHttp = true

    jest.mock('../../src/utils/request.ts', () => {
      return jest.fn().mockImplementation((opts) => {
        return Promise.resolve({data: {response_data: opts}, requestId:'testRequestId'})
      })
    })
    const tcb = require('../../src/index')
    let app = tcb.init(config)

    // mock一次http请求
    let mockReqRes = await
    app.callFunction({
      name: 'unexistFunction',
      data: { a: 1 }
    })

    let reqOpts = mockReqRes.result

    assert(reqOpts.url.indexOf('https') < 0)

    config.isHttp = false
     app = tcb.init(config)

    // mock一次https请求
    mockReqRes = await
    app.callFunction({
      name: 'unexistFunction',
      data: { a: 1 }
    })

    reqOpts = mockReqRes.result

    assert(reqOpts.url.indexOf('https') >= 0)
  })


it('校验config.version => x-sdk-version config.serviceUrl => url', async() => {
    config.version = 'test-version'
    config.serviceUrl = 'testUrl'

    jest.mock('../../src/utils/request.ts', () => {
      return jest.fn().mockImplementation((opts) => {
        return Promise.resolve({data: {response_data: opts}, requestId:'testRequestId'})
      })
    })
    const tcb = require('../../src/index')
    let app = tcb.init(config)

    // mock一次http请求
    let mockReqRes = await
    app.callFunction({
      name: 'unexistFunction',
      data: { a: 1 }
    })

    let reqOpts = mockReqRes.result
    assert(reqOpts.headers['x-sdk-version'] === config.version)
    assert(reqOpts.url.indexOf('testUrl') === 0)

  })

  // it('校验config.serviceUrl => url', async() => {
  //   config.serviceUrl = 'testUrl'

  //   jest.mock('../../src/utils/request.ts', () => {
  //     return jest.fn().mockImplementation((opts) => {
  //       return Promise.resolve({data: {response_data: opts}, requestId:'testRequestId'})
  //     })
  //   })
  //   const tcb = require('../../src/index')
  //   let app = tcb.init(config)

  //   // mock一次http请求
  //   let mockReqRes = await
  //   app.callFunction({
  //     name: 'unexistFunction',
  //     data: { a: 1 }
  //   })

  //   let reqOpts = mockReqRes.result
  //   assert(reqOpts.url.indexOf('testUrl') === 0)
  // })

  // it('微信openapi', async () => {
  //   let result = await app.callWxOpenApi({
  //     apiName: '/inner/svrkitclientcall',
  //     requestData: { name: 'jamespeng' },
  //   })
  //   console.log(result)
  //   // assert(result.result, '微信openapi失败');
  // }, 10000)

  // it('微信new openapi', async () => {
  //   let result = await app.callCompatibleWxOpenApi({
  //     apiName: '/AAA/BBB/sample',
  //     requestData: Buffer.from(JSON.stringify({ name: 'jamespeng' })),
  //   });
  //   console.log(result);
  //   // assert(result.result, '微信openapi失败');
  // }, 10000);

  // // mock callWxOpenApi 回包为string
  // it('微信openapi mock回包为string', async () => {
  //   jest.resetModules()
  //   jest.mock('request', () => {
  //     return jest.fn().mockImplementation((params, callback) => {
  //       callback(null, {statusCode: 200}, {data: {responseData: 'test'}})
  //     })
  //   })

  //   const tcb1 = require('../../src/index')
  //   const app1 = tcb1.init(config)
  //   try{
  //     let result = await app1.callWxOpenApi({
  //       apiName: '/inner/svrkitclientcall',
  //       requestData: { name: 'jamespeng' }
  //     })
  //     // console.log(result)
  //     assert(typeof result.result === 'string')
  //   }catch(err) {
  //     // assert(err.code === 'STORAGE_REQUEST_FAIL')
  //     console.log(err)
  //   }
  // })
})
