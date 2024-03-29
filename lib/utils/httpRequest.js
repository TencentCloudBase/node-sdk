"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const tracing_1 = require("./tracing");
const utils = __importStar(require("./utils"));
const code_1 = require("../const/code");
const symbol_1 = require("../const/symbol");
const cloudbase_1 = require("../cloudbase");
const request_1 = require("./request");
const requestHook_1 = require("./requestHook");
const wxCloudToken_1 = require("./wxCloudToken");
const signature_nodejs_1 = require("@cloudbase/signature-nodejs");
const url_1 = __importDefault(require("url"));
// import { version } from '../../package.json'
const secretManager_1 = __importDefault(require("./secretManager"));
const { version } = require('../../package.json');
const { E, second, processReturn, getServerInjectUrl } = utils;
class Request {
    constructor(args) {
        this.urlPath = '/admin';
        this.defaultTimeout = 15000;
        this.timestamp = new Date().valueOf();
        this.tracingInfo = tracing_1.generateTracingInfo();
        this.slowWarnTimer = null;
        // 请求参数
        this.hooks = {};
        this.args = args;
        this.config = args.config;
        this.opts = args.opts || {};
        this.secretManager = new secretManager_1.default();
    }
    /**
     * 最终发送请求
     */
    async request() {
        // 校验密钥是否存在
        await this.validateSecretIdAndKey();
        // 构造请求参数
        const params = await this.makeParams();
        const opts = await this.makeReqOpts(params);
        const action = this.getAction();
        const key = {
            functions: 'function_name',
            database: 'collectionName',
            wx: 'apiName'
        }[action.split('.')[0]];
        const argopts = this.opts;
        const config = this.config;
        // 发请求时未找到有效环境字段
        if (!params.envName) {
            // 检查config中是否有设置
            if (config.envName) {
                return processReturn(config.throwOnCode, Object.assign({}, code_1.ERROR.INVALID_PARAM, { message: '未取到init 指定 env！' }));
            }
            else {
                console.warn(`当前未指定env，将默认使用第一个创建的环境！`);
            }
        }
        // 注意：必须初始化为 null
        let retryOptions = null;
        if (argopts.retryOptions) {
            retryOptions = argopts.retryOptions;
        }
        else if (config.retries && typeof config.retries === 'number') {
            retryOptions = { retries: config.retries };
        }
        return request_1.extraRequest(opts, {
            debug: config.debug,
            op: `${action}:${this.args.params[key]}@${params.envName}`,
            seqId: this.getSeqId(),
            retryOptions: retryOptions,
            timingsMeasurerOptions: config.timingsMeasurerOptions || {}
        }).then((response) => {
            this.slowWarnTimer && clearTimeout(this.slowWarnTimer);
            const { body } = response;
            if (response.statusCode === 200) {
                let res;
                try {
                    res = typeof body === 'string' ? JSON.parse(body) : body;
                    if (this.hooks && this.hooks.handleData) {
                        res = this.hooks.handleData(res, null, response, body);
                    }
                }
                catch (e) {
                    res = body;
                }
                return res;
            }
            else {
                const e = E({
                    code: response.statusCode,
                    message: ` ${response.statusCode} ${http_1.default.STATUS_CODES[response.statusCode]} | [${opts.url}]`
                });
                throw e;
            }
        });
    }
    setHooks(hooks) {
        Object.assign(this.hooks, hooks);
    }
    getSeqId() {
        return this.tracingInfo.seqId;
    }
    /**
     * 接口action
     */
    getAction() {
        const { params } = this.args;
        const { action } = params;
        return action;
    }
    /**
     * 设置超时warning
     */
    setSlowWarning(timeout) {
        const action = this.getAction();
        const { seqId } = this.tracingInfo;
        this.slowWarnTimer = setTimeout(() => {
            /* istanbul ignore next */
            const msg = `Your current request ${action ||
                ''} is longer than 3s, it may be due to the network or your query performance | [${seqId}]`;
            /* istanbul ignore next */
            console.warn(msg);
        }, timeout);
    }
    /**
     * 构造params
     */
    async makeParams() {
        const { TCB_SESSIONTOKEN, TCB_ENV, SCF_NAMESPACE } = cloudbase_1.CloudBase.getCloudbaseContext();
        const args = this.args;
        const opts = this.opts;
        const config = this.config;
        const { eventId } = this.tracingInfo;
        const crossAuthorizationData = opts.getCrossAccountInfo && (await opts.getCrossAccountInfo()).authorization;
        const { wxCloudApiToken, wxCloudbaseAccesstoken } = wxCloudToken_1.getWxCloudToken();
        const params = Object.assign({}, args.params, { envName: config.envName, eventId,
            wxCloudApiToken,
            wxCloudbaseAccesstoken, tcb_sessionToken: TCB_SESSIONTOKEN || '', sessionToken: config.sessionToken, crossAuthorizationToken: crossAuthorizationData
                ? Buffer.from(JSON.stringify(crossAuthorizationData)).toString('base64')
                : '' });
        // 取当前云函数环境时，替换为云函数下环境变量
        if (params.envName === symbol_1.SYMBOL_CURRENT_ENV) {
            params.envName = TCB_ENV || SCF_NAMESPACE;
        }
        // 过滤value undefined
        utils.filterUndefined(params);
        return params;
    }
    /**
     *  构造请求项
     */
    async makeReqOpts(params) {
        const config = this.config;
        const args = this.args;
        const isInternal = await utils.checkIsInternalAsync();
        const url = this.getUrl({ isInternal });
        const method = this.getMethod();
        const opts = {
            url: url,
            method,
            // 先取模块的timeout，没有则取sdk的timeout，还没有就使用默认值
            // timeout: args.timeout || config.timeout || 15000,
            timeout: this.getTimeout(),
            // 优先取config，其次取模块，最后取默认
            headers: await this.getHeaders(url),
            proxy: config.proxy
        };
        opts.keepalive = config.keepalive === true;
        if (args.method === 'post') {
            if (args.isFormData) {
                opts.formData = params;
                opts.encoding = null;
            }
            else {
                opts.body = params;
                opts.json = true;
            }
        }
        else {
            /* istanbul ignore next */
            opts.qs = params;
        }
        return opts;
    }
    /**
     * 协议
     */
    getProtocol() {
        return this.config.isHttp === true ? 'http' : 'https';
    }
    /**
     * 请求方法
     */
    getMethod() {
        return this.args.method || 'get';
    }
    /**
     * 超时时间
     */
    getTimeout() {
        const { opts = {} } = this.args;
        // timeout优先级 自定义接口timeout > config配置timeout > 默认timeout
        return opts.timeout || this.config.timeout || this.defaultTimeout;
    }
    /**
     * 校验密钥和token是否存在
     */
    async validateSecretIdAndKey() {
        const { TENCENTCLOUD_SECRETID, TENCENTCLOUD_SECRETKEY, TENCENTCLOUD_SESSIONTOKEN } = cloudbase_1.CloudBase.getCloudbaseContext(); // 放在此处是为了兼容本地环境下读环境变量
        const isInSCF = utils.checkIsInScf();
        const isInContainer = utils.checkIsInEks();
        let opts = this.opts;
        let getCrossAccountInfo = opts.getCrossAccountInfo || this.config.getCrossAccountInfo;
        /* istanbul ignore if  */
        if (getCrossAccountInfo) {
            let crossAccountInfo = await getCrossAccountInfo();
            let { credential } = await getCrossAccountInfo();
            let { secretId, secretKey, token } = credential || {};
            this.config = Object.assign({}, this.config, { secretId,
                secretKey, sessionToken: token });
            this.opts.getCrossAccountInfo = () => Promise.resolve(crossAccountInfo);
            if (!this.config.secretId || !this.config.secretKey) {
                throw E(Object.assign({}, code_1.ERROR.INVALID_PARAM, { message: 'missing secretId or secretKey of tencent cloud' }));
            }
        }
        else {
            const { secretId, secretKey } = this.config;
            if (!secretId || !secretKey) {
                /* istanbul ignore if  */
                if (isInContainer) {
                    // 这种情况有可能是在容器内，此时尝试拉取临时
                    const tmpSecret = await this.secretManager.getTmpSecret();
                    this.config = Object.assign({}, this.config, { secretId: tmpSecret.id, secretKey: tmpSecret.key, sessionToken: tmpSecret.token });
                    return;
                }
                if (!TENCENTCLOUD_SECRETID || !TENCENTCLOUD_SECRETKEY) {
                    if (isInSCF) {
                        throw E(Object.assign({}, code_1.ERROR.INVALID_PARAM, { message: 'missing authoration key, redeploy the function' }));
                    }
                    else {
                        throw E(Object.assign({}, code_1.ERROR.INVALID_PARAM, { message: 'missing secretId or secretKey of tencent cloud' }));
                    }
                }
                else {
                    this.config = Object.assign({}, this.config, { secretId: TENCENTCLOUD_SECRETID, secretKey: TENCENTCLOUD_SECRETKEY, sessionToken: TENCENTCLOUD_SESSIONTOKEN });
                }
            }
        }
    }
    /**
     *
     * 获取headers 此函数中设置authorization
     */
    async getHeaders(url) {
        const config = this.config;
        const { secretId, secretKey } = config;
        const args = this.args;
        const method = this.getMethod();
        const { TCB_SOURCE } = cloudbase_1.CloudBase.getCloudbaseContext();
        // Note: 云函数被调用时可能调用端未传递 SOURCE，TCB_SOURCE 可能为空
        const SOURCE = utils.checkIsInScf() ? `${TCB_SOURCE || ''},scf` : ',not_scf';
        let requiredHeaders = {
            'User-Agent': `tcb-node-sdk/${version}`,
            'x-tcb-source': SOURCE,
            'x-client-timestamp': this.timestamp,
            'X-SDK-Version': `tcb-node-sdk/${version}`,
            Host: url_1.default.parse(url).host
        };
        if (config.version) {
            requiredHeaders['X-SDK-Version'] = config.version;
        }
        if (this.tracingInfo.trace) {
            requiredHeaders['x-tcb-tracelog'] = this.tracingInfo.trace;
        }
        const region = this.config.region || process.env.TENCENTCLOUD_REGION || '';
        if (region) {
            requiredHeaders['X-TCB-Region'] = region;
        }
        requiredHeaders = Object.assign({}, config.headers, args.headers, requiredHeaders);
        const { authorization, timestamp } = signature_nodejs_1.sign({
            secretId: secretId,
            secretKey: secretKey,
            method: method,
            url: url,
            params: await this.makeParams(),
            headers: requiredHeaders,
            withSignedParams: true,
            timestamp: second() - 1
        });
        requiredHeaders['Authorization'] = authorization;
        requiredHeaders['X-Signature-Expires'] = 600;
        requiredHeaders['X-Timestamp'] = timestamp;
        return Object.assign({}, requiredHeaders);
    }
    /**
     * 获取url
     * @param action
     */
    /* eslint-disable-next-line complexity */
    getUrl(options = {
        isInternal: false
    }) {
        if (utils.checkIsInScf()) {
            // 云函数环境下，应该包含以下环境变量，如果没有，后续逻辑可能会有问题
            if (!process.env.TENCENTCLOUD_REGION) {
                console.error('[ERROR] missing `TENCENTCLOUD_REGION` environment');
            }
            if (!process.env.SCF_NAMESPACE) {
                console.error('[ERROR] missing `SCF_NAMESPACE` environment');
            }
        }
        const { TCB_ENV, SCF_NAMESPACE } = cloudbase_1.CloudBase.getCloudbaseContext();
        // 优先级：用户配置 > 环境变量
        const region = this.config.region || process.env.TENCENTCLOUD_REGION || '';
        const envId = this.config.envName === symbol_1.SYMBOL_CURRENT_ENV
            ? TCB_ENV || SCF_NAMESPACE
            : this.config.envName || '';
        // 有地域信息则访问地域级别域名，无地域信息则访问默认域名，默认域名固定解析到上海地域保持兼容
        const internetRegionEndpoint = region
            ? `${region}.tcb-api.tencentcloudapi.com`
            : `tcb-api.tencentcloudapi.com`;
        const internalRegionEndpoint = region
            ? `internal.${region}.tcb-api.tencentcloudapi.com`
            : `internal.tcb-api.tencentcloudapi.com`;
        // 同地域走内网，跨地域走公网
        const isSameRegionVisit = this.config.region
            ? this.config.region === process.env.TENCENTCLOUD_REGION
            : true;
        const endpoint = isSameRegionVisit && (options.isInternal)
            ? internalRegionEndpoint
            : internetRegionEndpoint;
        const envEndpoint = envId ? `${envId}.${endpoint}` : endpoint;
        const protocol = options.isInternal ? 'http' : this.getProtocol();
        // 注意：云函数环境下有地域信息，云应用环境下不确定是否有，如果没有，用户必须显式的传入
        const defaultUrl = `${protocol}://${envEndpoint}${this.urlPath}`;
        const { eventId, seqId } = this.tracingInfo;
        const { serviceUrl } = this.config;
        const serverInjectUrl = getServerInjectUrl();
        const url = serviceUrl || serverInjectUrl || defaultUrl;
        const qs = cloudbase_1.CloudBase.scfContext
            ? `&eventId=${eventId}&seqId=${seqId}&scfRequestId=${cloudbase_1.CloudBase.scfContext.requestId}`
            : `&eventId=${eventId}&seqId=${seqId}`;
        return url.includes('?') ? `${url}${qs}` : `${url}?${qs}`;
    }
}
exports.Request = Request;
// 业务逻辑都放在这里处理
exports.default = async (args) => {
    const req = new Request(args);
    const config = args.config;
    const { action } = args.params;
    if (action === 'wx.openApi' || action === 'wx.wxPayApi') {
        req.setHooks({ handleData: requestHook_1.handleWxOpenApiData });
    }
    if (action.startsWith('database')) {
        req.setSlowWarning(3000);
    }
    try {
        const res = await req.request();
        // 检查res是否为return {code, message}回包
        if (res && res.code) {
            // 判断是否设置config._returnCodeByThrow = false
            return processReturn(config.throwOnCode, res);
        }
        return res;
    }
    finally {
        //
    }
};
