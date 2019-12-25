import tcb from '../../src/index'
import assert from 'assert'
import config from '../config.local'
import {ERROR} from '../../src/const/code'


// TODO 删除前先创建
describe('wx.openApi: 微信openapi', () => {
  const app = tcb.init(config)

  it('传参JSON.stringify报错', async() => {
    let a:any = {}, b:any = {}
    a.c = b
    b.c = a
    let result
    try {
      result = await app.callWxOpenApi({
        apiName: '/inner/svrkitclientcall',
        requestData: a,
      })
    }catch(e) {
      // console.log(e)
      assert(e.code === ERROR.INVALID_PARAM.code)
    }
  })

  it('微信openapi', async () => {
    let result = await app.callWxOpenApi({
      apiName: '/inner/svrkitclientcall',
      requestData: { name: 'jamespeng' },
    })
    console.log(result)
    // assert(result.result, '微信openapi失败');
  }, 10000)

  it('微信new openapi', async () => {
    let result = await app.callCompatibleWxOpenApi({
      apiName: '/AAA/BBB/sample',
      requestData: Buffer.from(JSON.stringify({ name: 'jamespeng' })),
    });
    console.log(result);
    // assert(result.result, '微信openapi失败');
  }, 10000);

  // mock callWxOpenApi 回包为string
  it('微信openapi mock回包为string', async () => {
    jest.resetModules()
    jest.mock('request', () => {
      return jest.fn().mockImplementation((params, callback) => {
        callback(null, {statusCode: 200}, {data: {responseData: 'test'}})
      })
    })

    const tcb1 = require('../../src/index')
    const app1 = tcb1.init(config)
    try{
      let result = await app1.callWxOpenApi({
        apiName: '/inner/svrkitclientcall',
        requestData: { name: 'jamespeng' }
      })
      // console.log(result)
      assert(typeof result.result === 'string')
    }catch(err) {
      // assert(err.code === 'STORAGE_REQUEST_FAIL')
      console.log(err)
    }
  })

  it('微信 wxPayApi', async () => {
    let result = await app.callWxPayApi({
      apiName: 'cloudPay.getRefundStatus',
      requestData: Buffer.from(
        JSON.stringify({ api: 'getRefundStatus', data: {} })
      )
    })
    console.log(result)
    // assert(result.result, '微信openapi失败');
  }, 10000)
})
