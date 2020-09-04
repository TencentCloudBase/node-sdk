import http from 'http'
import { generateTracingInfo } from './tracing'
import * as utils from './utils'
import {
    ICloudBaseConfig,
    IRequestInfo,
    ICustomParam,
    IReqOpts,
    IReqHooks,
    ICustomReqOpts
} from '../type/index'
import { ERROR } from '../const/code'
import { SYMBOL_CURRENT_ENV } from '../const/symbol'
import { CloudBase } from '../cloudbase'

import { extraRequest } from './request'
import { handleWxOpenApiData } from './requestHook'
import { getWxCloudApiToken } from './getWxCloudApiToken'
import { sign } from '@cloudbase/signature-nodejs'
import URL from 'url'
// import { version } from '../../package.json'
import SecretManager from './secretManager'
const { version } = require('../../package.json')

const { E, second, processReturn, getServerInjectUrl } = utils

export class Request {
    private args: IRequestInfo
    private config: ICloudBaseConfig
    private opts: ICustomReqOpts
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
    private secretManager: SecretManager

    private slowWarnTimer: NodeJS.Timer = null

    // 请求参数

    private hooks: IReqHooks = {}

    public constructor(args: IRequestInfo) {
        this.args = args
        this.config = args.config
        this.opts = args.opts || {}
        this.secretManager = new SecretManager()
    }

    /**
     * 最终发送请求
     */
    public async request(): Promise<any> {
        // 校验密钥是否存在
        await this.validateSecretIdAndKey()
        // 构造请求参数
        const params = await this.makeParams()
        const opts = await this.makeReqOpts(params)
        const action = this.getAction()
        const key = {
            functions: 'function_name',
            database: 'collectionName',
            wx: 'apiName'
        }[action.split('.')[0]]

        const argopts: any = this.opts
        const config = this.config

        // 发请求时未找到有效环境字段
        if (!params.envName) {
            // 检查config中是否有设置
            if (config.envName) {
                return processReturn(config.throwOnCode, {
                    ...ERROR.INVALID_PARAM,
                    message: '未取到init 指定 env！'
                })
            } else {
                console.warn(`当前未指定env，将默认使用第一个创建的环境！`)
            }
        }

        // 注意：必须初始化为 null
        let retryOptions: any = null
        if (argopts.retryOptions) {
            retryOptions = argopts.retryOptions
        } else if (config.retries && typeof config.retries === 'number') {
            retryOptions = { retries: config.retries }
        }

        return extraRequest(opts, {
            debug: config.debug,
            op: `${action}:${this.args.params[key]}@${params.envName}`,
            seqId: this.getSeqId(),
            retryOptions: retryOptions,
            timingsMeasurerOptions: config.timingsMeasurerOptions || {}
        }).then((response: any) => {
            this.slowWarnTimer && clearTimeout(this.slowWarnTimer)
            const { body } = response
            if (response.statusCode === 200) {
                let res
                try {
                    res = typeof body === 'string' ? JSON.parse(body) : body
                    if (this.hooks && this.hooks.handleData) {
                        res = this.hooks.handleData(res, null, response, body)
                    }
                } catch (e) {
                    res = body
                }
                return res
            } else {
                const e = E({
                    code: response.statusCode,
                    message: ` ${response.statusCode} ${
                        http.STATUS_CODES[response.statusCode]
                    } | [${opts.url}]`
                })
                throw e
            }
        })
    }

    public setHooks(hooks: IReqHooks) {
        Object.assign(this.hooks, hooks)
    }

    public getSeqId(): string {
        return this.tracingInfo.seqId
    }

    /**
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
    public setSlowWarning(timeout: number) {
        const action = this.getAction()
        const { seqId } = this.tracingInfo
        this.slowWarnTimer = setTimeout(() => {
            const msg = `Your current request ${action ||
                ''} is longer than 3s, it may be due to the network or your query performance | [${seqId}]`
            console.warn(msg)
        }, timeout)
    }

    /**
     * 构造params
     */
    public async makeParams(): Promise<any> {
        const { TCB_SESSIONTOKEN, TCB_ENV, SCF_NAMESPACE } = CloudBase.getCloudbaseContext()
        const args = this.args
        const opts = this.opts
        const config = this.config

        const { eventId } = this.tracingInfo
        let crossAuthorizationData =
            opts.getCrossAccountInfo && (await opts.getCrossAccountInfo()).authorization

        const params: ICustomParam = {
            ...args.params,
            envName: config.envName,
            eventId,
            // wxCloudApiToken: process.env.WX_API_TOKEN || '',
            wxCloudApiToken: getWxCloudApiToken(),
            // 对应服务端 wxCloudSessionToken
            tcb_sessionToken: TCB_SESSIONTOKEN || '',
            sessionToken: config.sessionToken,
            sdk_version: version, // todo 可去掉该参数
            crossAuthorizationToken: crossAuthorizationData
                ? Buffer.from(JSON.stringify(crossAuthorizationData)).toString('base64')
                : ''
        }

        // 取当前云函数环境时，替换为云函数下环境变量
        if (params.envName === SYMBOL_CURRENT_ENV) {
            params.envName = TCB_ENV || SCF_NAMESPACE
        }

        // 过滤value undefined
        utils.filterUndefined(params)

        return params
    }

    /**
     *  构造请求项
     */
    public async makeReqOpts(params): Promise<IReqOpts> {
        const config = this.config
        const args = this.args
        const url = this.getUrl()
        const method = this.getMethod()

        const opts: IReqOpts = {
            url: url,
            method,
            // 先取模块的timeout，没有则取sdk的timeout，还没有就使用默认值
            // timeout: args.timeout || config.timeout || 15000,
            timeout: this.getTimeout(), // todo 细化到api维度 timeout
            // 优先取config，其次取模块，最后取默认
            headers: await this.getHeaders(params),
            proxy: config.proxy
        }

        if (config.forever === true) {
            opts.forever = true
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
     * 校验密钥和token是否存在
     */
    private async validateSecretIdAndKey(): Promise<void> {
        const {
            TENCENTCLOUD_SECRETID,
            TENCENTCLOUD_SECRETKEY,
            TENCENTCLOUD_SESSIONTOKEN
        } = CloudBase.getCloudbaseContext() // 放在此处是为了兼容本地环境下读环境变量

        const isInSCF = utils.checkIsInScf()
        const isInContainer = utils.checkIsInContainer()

        let opts = this.opts
        let getCrossAccountInfo = opts.getCrossAccountInfo || this.config.getCrossAccountInfo
        if (getCrossAccountInfo) {
            let crossAccountInfo = await getCrossAccountInfo()
            let { credential } = await getCrossAccountInfo()
            let { secretId, secretKey, token } = credential || {}
            this.config = {
                ...this.config,
                secretId,
                secretKey,
                sessionToken: token
            }
            this.opts.getCrossAccountInfo = () => Promise.resolve(crossAccountInfo)
            if (!this.config.secretId || !this.config.secretKey) {
                throw E({
                    ...ERROR.INVALID_PARAM,
                    message: 'missing secretId or secretKey of tencent cloud'
                })
            }
        } else {
            const { secretId, secretKey } = this.config
            if (!secretId || !secretKey) {
                if (isInContainer) {
                    // 这种情况有可能是在容器内，此时尝试拉取临时
                    const tmpSecret = await this.secretManager.getTmpSecret()
                    this.config = {
                        ...this.config,
                        secretId: tmpSecret.id,
                        secretKey: tmpSecret.key,
                        sessionToken: tmpSecret.token
                    }
                    return
                }

                if (!TENCENTCLOUD_SECRETID || !TENCENTCLOUD_SECRETKEY) {
                    if (isInSCF) {
                        throw E({
                            ...ERROR.INVALID_PARAM,
                            message: 'missing authoration key, redeploy the function'
                        })
                    } else {
                        throw E({
                            ...ERROR.INVALID_PARAM,
                            message: 'missing secretId or secretKey of tencent cloud'
                        })
                    }
                } else {
                    this.config = {
                        ...this.config,
                        secretId: TENCENTCLOUD_SECRETID,
                        secretKey: TENCENTCLOUD_SECRETKEY,
                        sessionToken: TENCENTCLOUD_SESSIONTOKEN
                    }
                }
            }
        }
    }

    /**
     *
     * 获取headers 此函数中设置authorization
     */
    private async getHeaders(params): Promise<any> {
        let { TCB_SOURCE } = CloudBase.getCloudbaseContext()
        const config = this.config
        const { secretId, secretKey } = config
        const args = this.args
        const method = this.getMethod()
        const isInSCF = utils.checkIsInScf()
        // Note: 云函数被调用时可能调用端未传递 SOURCE，TCB_SOURCE 可能为空
        TCB_SOURCE = TCB_SOURCE || ''
        const SOURCE = isInSCF ? `${TCB_SOURCE},scf` : ',not_scf'
        const url = this.getUrl()
        // 默认
        let requiredHeaders = {
            'User-Agent': `tcb-node-sdk/${version}`,
            'x-tcb-source': SOURCE,
            'x-client-timestamp': this.timestamp,
            'X-SDK-Version': `tcb-node-sdk/${version}`,
            Host: URL.parse(url).host
        }

        if (config.version) {
            requiredHeaders['X-SDK-Version'] = config.version
        }

        requiredHeaders = { ...config.headers, ...args.headers, ...requiredHeaders }

        const { authorization, timestamp } = sign({
            secretId: secretId,
            secretKey: secretKey,
            method: method,
            url: url,
            params: await this.makeParams(),
            headers: requiredHeaders,
            withSignedParams: true,
            timestamp: second() - 1
        })

        requiredHeaders['Authorization'] = authorization
        requiredHeaders['X-Signature-Expires'] = 600
        requiredHeaders['X-Timestamp'] = timestamp

        return { ...requiredHeaders }
    }

    /**
     * 获取url
     * @param action
     */
    private getUrl(): string {
        const protocol = this.getProtocol()
        const isInSCF = utils.checkIsInScf()
        const isInContainer = utils.checkIsInContainer()
        const { eventId, seqId } = this.tracingInfo
        const { customApiUrl } = this.args
        const { serviceUrl } = this.config
        const serverInjectUrl = getServerInjectUrl()

        const defaultUrl =
            isInSCF || isInContainer
                ? `http://${this.inScfHost}${this.urlPath}`
                : `${protocol}://${this.defaultEndPoint}${this.urlPath}`

        let url = serviceUrl || serverInjectUrl || customApiUrl || defaultUrl

        let urlQueryStr = `&eventId=${eventId}&seqId=${seqId}`
        const scfContext = CloudBase.scfContext
        if (scfContext) {
            urlQueryStr = `&eventId=${eventId}&seqId=${seqId}&scfRequestId=${scfContext.request_id}`
        }

        if (url.includes('?')) {
            url = `${url}${urlQueryStr}`
        } else {
            url = `${url}?${urlQueryStr}`
        }

        return url
    }
}

// 业务逻辑都放在这里处理
export default async (args: IRequestInfo): Promise<any> => {
    const req = new Request(args)
    const config = args.config
    const { action } = args.params

    if (action === 'wx.openApi' || action === 'wx.wxPayApi') {
        req.setHooks({ handleData: handleWxOpenApiData })
    }

    if (action.startsWith('database')) {
        req.setSlowWarning(3000)
    }

    try {
        const res = await req.request()
        // 检查res是否为return {code, message}回包
        if (res && res.code) {
            // 判断是否设置config._returnCodeByThrow = false
            return processReturn(config.throwOnCode, res)
        }
        return res
    } finally {
        //
    }
}
