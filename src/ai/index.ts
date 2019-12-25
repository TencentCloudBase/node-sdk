import httpRequest from '../utils/httpRequest'
import {E} from '../utils/utils'
import {ERROR} from '../const/code'
import {ICustomReqOpts} from '../type/index'
import {CloudBase} from '../cloudbase'

/**
 * 调用AI服务
 * @param {Object} param  AI 服务参数
 * @return {Promise}
 */
export async function callAI(cloudbase: CloudBase, { param }, opts: ICustomReqOpts) {
  try {
    param = param ? JSON.stringify(param) : ''
  } catch (e) {
    throw e
  }
  if (!param) {
    throw E({ ...ERROR.INVALID_PARAM, message: '参数不能为空' })
  }

  let params = Object.assign({}, {
    action: 'ai.invokeAI',
    param
  })

  return httpRequest({
    config: cloudbase.config,
    params,
    method: 'post',
    opts,
    headers: {
      'content-type': 'application/json'
    }
  })
}

