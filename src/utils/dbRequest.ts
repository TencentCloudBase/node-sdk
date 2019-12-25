import httpRequest from './httpRequest'
import {ICustomReqOpts} from '../type'

/**
 * 数据库模块的通用请求方法
 *
 * @author haroldhu
 * @internal
 */
export class DBRequest {

  private config: any
  /**
   * 初始化
   *
   * @internal
   * @param config
   */
  constructor(config) {
    this.config = config
  }

  /**
   * 发送请求
   *
   * @param dbParams   - 数据库请求参数
   * @param opts  - 可选配置项
   */
  async send(api:string, data:any, opts?: ICustomReqOpts): Promise<any> {
    const params = Object.assign({}, data, {
      action: api
    })

    return await httpRequest({
      config: this.config.config,
      params,
      method: 'post',
      opts,
      headers: {
        'content-type': 'application/json'
      }
    })
  }
}

