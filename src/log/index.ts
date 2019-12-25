import {E} from '../utils/utils'
import {ERROR} from '../const/code'

/**
 *
 *
 * @class Log
 */
export class Log {
  private src
  public isSupportClsReport: boolean

  constructor() {
    this.src = 'app'
    this.isSupportClsReport = true
    if(process.env._SCF_TCB_LOG != '1') {
      this.isSupportClsReport = false
    } else if(!(<any>console).__baseLog__) {
      this.isSupportClsReport = false
    }

    if(!this.isSupportClsReport) {
      // 当前非tcb scf环境  log功能会退化为console
      console.warn('请检查您是否在本地环境 或者 未开通高级日志功能，当前环境下无法上报cls日志，默认使用console')
    }
  }

  /**
   *
   *
   * @param {*} logMsg
   * @param {*} logLevel
   * @returns
   * @memberof Log
   */
  transformMsg(logMsg) {
    // 目前logMsg只支持字符串value且不支持多级, 加一层转换处理
    let realMsg = {}

    realMsg = Object.assign({}, realMsg, logMsg)
    return realMsg
  }

  /**
   *
   *
   * @param {*} logMsg
   * @param {*} logLevel
   * @memberof Log
   */
  baseLog(logMsg, logLevel) {
    // 判断当前是否属于tcb scf环境

    if (Object.prototype.toString.call(logMsg).slice(8, -1) !== 'Object') {
      throw E({
        ...ERROR.INVALID_PARAM,
        message: 'log msg must be an object'
      })
    }

    const msgContent = this.transformMsg(logMsg)

    if(this.isSupportClsReport) {
      (<any>console).__baseLog__(msgContent, logLevel)
    }else {
      if(console[logLevel]) {
        console[logLevel](msgContent)
      }
    }
  }

  /**
   *
   *
   * @param {*} logMsg
   * @memberof Log
   */
  log(logMsg) {
    this.baseLog(logMsg, 'log')
  }

  /**
   *
   *
   * @param {*} logMsg
   * @memberof Log
   */
  info(logMsg) {
    this.baseLog(logMsg, 'info')
  }

  /**
   *
   *
   * @param {*} logMsg
   * @memberof Log
   */
  error(logMsg) {
    this.baseLog(logMsg, 'error')
  }

  /**
   *
   *
   * @param {*} logMsg
   * @memberof Log
   */
  warn(logMsg) {
    this.baseLog(logMsg, 'warn')
  }
}

export const logger = () => {
  return new Log()
}
