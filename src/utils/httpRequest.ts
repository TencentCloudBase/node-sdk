import { Auth } from './auth'
import { generateTracingInfo } from './tracing'
import * as utils from './utils'
import { ICloudBaseConfig, IRequestInfo, ICustomParam, IReqOpts, IReqHooks } from '../type/index'
import { ERROR } from '../const/code'
import { SYMBOL_CURRENT_ENV } from '../const/symbol'
import { CloudBase } from '../cloudbase'

import baseRequest from './request'
import { handleWxOpenApiData } from './requestHook'
import { getWxCloudApiToken } from './getWxCloudApiToken'

const { version } = require('../../package.json')
const { E } = utils

export class Request {
    private args: IRequestInfo
    private config: ICloudBaseConfig
    private defaultEndPoint = 'tcb-admin.tencentcloudapi.com'
    private inScfHost = 'tcb-admin.tencentyun.com'
    // private openApiHost: string = 'tcb-open.tencentcloudapi.com'
    private urlPath = '/admin'
    private defaultTimeout = 15000
    private timestamp: number = new Date().valueOf()
    private tracingInfo: {
        eventId: string
        seqId: string
    } = generateTracingInfo()

    public constructor(args: IRequestInfo) {
        this.args = args
        this.config = args.config
    }

    /**
     *
     * 接口action
     */
    public getAction(): string {
        const { params } = this.args
        const { action } = params
        return action
    }

    /**
     * 设置超时warning
     */
    public setSlowRequeryWarning(action: string): NodeJS.Timer {
        const { seqId } = this.tracingInfo

        const warnStr = `Your current request ${action ||
            ''} is longer than 3s, it may be due to the network or your query performance | [${seqId}]`
        // 暂针对数据库请求
        const warnTimer = setTimeout(() => {
            console.warn(warnStr)
        }, 3000)
        return warnTimer
    }

    /**
     * 构造发送请求
     */
    public getOpts(): IReqOpts {
        this.validateSecretIdAndKey()

        const args = this.args

        const config = this.config

        const { eventId } = this.tracingInfo

        let params: ICustomParam = {
            ...args.params,
            envName: config.envName,
            eventId,
            // wxCloudApiToken: process.env.WX_API_TOKEN || '',
            wxCloudApiToken: getWxCloudApiToken(),
            // 对应服务端 wxCloudSessionToken
            tcb_sessionToken: process.env.TCB_SESSIONTOKEN || ''
        }

        // 取当前云函数环境时，替换为云函数下环境变量
        if (params.envName === SYMBOL_CURRENT_ENV) {
            params.envName = process.env.TCB_ENV || process.env.SCF_NAMESPACE
        }

        // 过滤value undefined
        utils.filterUndefined(params)

        const authoration = this.getAuthorization({ ...params })

        params.authorization = authoration
        config.sessionToken && (params.sessionToken = config.sessionToken)
        params.sdk_version = version

        // 对不参与签名项 进行合并
        if (args.unSignedParams) {
            params = Object.assign(params, args.unSignedParams)
        }

        const opts = this.makeReqOpts(params)
        return opts
    }

    /**
     * 协议
     */
    private getProtocol(): string {
        return this.config.isHttp === true ? 'http' : 'https'
    }

    /**
     * 请求方法
     */
    private getMethod(): string {
        return this.args.method || 'get'
    }

    /**
     * 超时时间
     */
    private getTimeout(): number {
        const { opts = {} } = this.args
        // timeout优先级 自定义接口timeout > config配置timeout > 默认timeout
        return opts.timeout || this.config.timeout || this.defaultTimeout
    }

    /**
     * 获取
     */

    /**
     * 校验密钥和token是否存在
     */
    private validateSecretIdAndKey(): void {
        const isInSCF = utils.checkIsInScf()
        const { secretId, secretKey } = this.config
        if (!secretId || !secretKey) {
            if (isInSCF) {
                const envSecretId = process.env.TENCENTCLOUD_SECRETID
                const envSecretKey = process.env.TENCENTCLOUD_SECRETKEY
                const sessionToken = process.env.TENCENTCLOUD_SESSIONTOKEN
                if (!envSecretId || !envSecretKey) {
                    throw E({
                        ...ERROR.INVALID_PARAM,
                        message: 'missing authoration key, redeploy the function'
                    })
                } else {
                    this.config = {
                        ...this.config,
                        secretId: envSecretId,
                        secretKey: envSecretKey,
                        sessionToken: sessionToken
                    }
                    return
                }
            }
            throw E({
                ...ERROR.INVALID_PARAM,
                message: 'missing secretId or secretKey of tencent cloud'
            })
        }
    }

    /**
     *
     * 获取headers
     */
    private getHeaders(): any {
        const config = this.config
        const args = this.args
        const isInSCF = utils.checkIsInScf()
        // Note: 云函数被调用时可能调用端未传递 SOURCE，TCB_SOURCE 可能为空
        const TCB_SOURCE = process.env.TCB_SOURCE || ''
        const SOURCE = isInSCF ? `${TCB_SOURCE},scf` : ',not_scf'
        // 默认
        const requiredHeaders = {
            'user-agent': `tcb-admin-sdk/${version}`,
            'x-tcb-source': SOURCE,
            'x-client-timestamp': this.timestamp
        }

        if (config.version) {
            requiredHeaders['x-sdk-version'] = config.version
        }

        return { ...config.headers, ...args.headers, ...requiredHeaders }
    }

    /**
     * 获取authorization
     */
    private getAuthorization(params: ICustomParam): string {
        const headers = this.getHeaders()
        const method = this.getMethod()
        const { secretId, secretKey } = this.config

        const authObj = {
            SecretId: secretId,
            SecretKey: secretKey,
            Method: method,
            Pathname: this.urlPath,
            Query: params,
            Headers: { ...headers }
        }

        const auth = new Auth(authObj)

        const authorization = auth.getAuth()
        return authorization
    }

    /**
     * 获取url
     * @param action
     */
    private getUrl(action: string): string {
        const protocol = this.getProtocol()
        const isInSCF = utils.checkIsInScf()
        const { customEndPoint } = this.args
        const { serviceUrl } = this.config

        if (serviceUrl) {
            return serviceUrl
        }

        if (customEndPoint) {
            return `${protocol}://${customEndPoint}${this.urlPath}`
        }

        let url = `${protocol}://${this.defaultEndPoint}${this.urlPath}`

        if (isInSCF) {
            url = `http://${this.inScfHost}${this.urlPath}`
        }

        // if (action === 'wx.api' || action === 'wx.openApi') {
        //   url = `${protocol}://${this.openApiHost}${this.urlPath}`
        // }
        return url
    }

    /**
     *  构造请求项
     */
    private makeReqOpts(params: ICustomParam): IReqOpts {
        const config = this.config
        const args = this.args
        const url = this.getUrl(params.action)
        const method = this.getMethod()
        const { eventId, seqId } = this.tracingInfo

        const opts: IReqOpts = {
            url,
            method,
            // 先取模块的timeout，没有则取sdk的timeout，还没有就使用默认值
            // timeout: args.timeout || config.timeout || 15000,
            timeout: this.getTimeout(), // todo 细化到api维度 timeout
            // 优先取config，其次取模块，最后取默认
            headers: this.getHeaders(),
            proxy: config.proxy
        }

        let urlStr = `&eventId=${eventId}&seqId=${seqId}`
        const scfContext = CloudBase.scfContext
        if (scfContext) {
            urlStr = `&eventId=${eventId}&seqId=${seqId}&scfRequestId=${scfContext.request_id}`
        }

        if (opts.url.includes('?')) {
            opts.url = `${opts.url}${urlStr}`
        } else {
            opts.url = `${opts.url}?${urlStr}`
        }

        if (args.method === 'post') {
            if (args.isFormData) {
                opts.formData = params
                opts.encoding = null
            } else {
                opts.body = params
                opts.json = true
            }
        } else {
            opts.qs = params
        }

        return opts
    }
}

// 业务逻辑都放在这里处理
export default async (args: IRequestInfo): Promise<any> => {
    const req = new Request(args)
    const reqOpts = req.getOpts()
    const action = req.getAction()

    let reqHooks: IReqHooks
    let warnTimer = null

    if (action === 'wx.openApi' || action === 'wx.wxPayApi') {
        reqHooks = {
            handleData: handleWxOpenApiData
        }
    }

    if (action.indexOf('database') >= 0) {
        warnTimer = req.setSlowRequeryWarning(action)
    }

    if (reqHooks) {
        return baseRequest(reqOpts, reqHooks)
    }

    try {
        return await baseRequest(reqOpts)
    } finally {
        if (warnTimer) {
            clearTimeout(warnTimer)
        }
    }
}
