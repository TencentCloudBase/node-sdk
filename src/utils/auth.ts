import * as crypto from 'crypto'
import {clone, camSafeUrlEncode, E} from './utils'
import {ERROR} from '../const/code'

interface IAuthOpts {
  SecretId?: string
  SecretKey?: string
  Method?: string
  Pathname?: string
  Query?: Object
  Headers?: Object
  Expires?: number
  expires?: number
}

export class Auth {
  private opt: IAuthOpts
  private qSignAlgorithm: string = 'sha1'

  constructor(opt: IAuthOpts) {
    this.opt = opt || {}
  }

  private getObjectKeys(obj: any): Array<any> {
    const list = []
      for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
          if (obj[key] === undefined) {
            continue
          }
          list.push(key)
        }
      }
      return list.sort()
  }

  private obj2str(obj: any): string {
    var i, key, val
      var list = []
      var keyList = this.getObjectKeys(obj)
      for (i = 0; i < keyList.length; i++) {
        key = keyList[i]
        if (obj[key] === undefined) {
          continue
        }
        val = obj[key] === null ? '' : obj[key]
        if (typeof val !== 'string') {
          val = JSON.stringify(val)
        }
        key = key.toLowerCase()
        key = camSafeUrlEncode(key)
        val = camSafeUrlEncode(val) || ''
        list.push(key + '=' + val)
      }
      return list.join('&')
  }

  public getAuth(): string {
    const opt = this.opt
    const SecretId = opt.SecretId
    const SecretKey = opt.SecretKey
    const method = (opt.Method || 'get').toLowerCase()
    const queryParams = clone(opt.Query || {})
    const headers = clone(opt.Headers || {})
    let pathname = opt.Pathname || '/'
    pathname.indexOf('/') !== 0 && (pathname = '/' + pathname)

    // if (!SecretId) {
    //   throw E({...ERROR.INVALID_PARAM, message: 'missing param SecretId'})
    // }

    // if (!SecretKey) {
    //   throw E({...ERROR.INVALID_PARAM, message: 'missing param SecretKey'})
    // }

    // 签名有效起止时间
    const now = Math.floor(new Date().getTime() / 1000) - 1
    let exp = now
    exp += 900 // 签名过期时间为当前 + 900s

    // 要用到的 Authorization 参数列表
    // var qSignAlgorithm = 'sha1'
    const qAk = SecretId
    const qSignTime = now + ';' + exp
    const qKeyTime = now + ';' + exp
    const qHeaderList = this.getObjectKeys(headers)
      .join(';')
      .toLowerCase()
    const qUrlParamList = this.getObjectKeys(queryParams)
      .join(';')
      .toLowerCase()

    // 签名算法说明文档：https://www.qcloud.com/document/product/436/7778
    // 步骤一：计算 SignKey
    const signKey = crypto
      .createHmac('sha1', SecretKey)
      .update(qKeyTime)
      .digest('hex')

    // 步骤二：构成 FormatString
    const formatString = [
      method,
      pathname,
      this.obj2str(queryParams),
      this.obj2str(headers),
      ''
    ].join('\n')

    const formatStrBuffer = Buffer.from(formatString, 'utf8')

    // 步骤三：计算 StringToSign
    var sha1Algo = crypto.createHash('sha1')
    sha1Algo.update(formatStrBuffer)
    var res = sha1Algo.digest('hex')
    var stringToSign = ['sha1', qSignTime, res, ''].join('\n')

    // 步骤四：计算 Signature
    var qSignature = crypto
      .createHmac('sha1', signKey)
      .update(stringToSign)
      .digest('hex')

    // 步骤五：构造 Authorization
    var authorization = [
      'q-sign-algorithm=' + this.qSignAlgorithm,
      'q-ak=' + qAk,
      'q-sign-time=' + qSignTime,
      'q-key-time=' + qKeyTime,
      'q-header-list=' + qHeaderList,
      'q-url-param-list=' + qUrlParamList,
      'q-signature=' + qSignature
    ].join('&')

    return authorization
  }
}






