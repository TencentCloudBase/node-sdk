"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const auth_1 = require("./auth");
const tracing_1 = require("./tracing");
const utils = __importStar(require("./utils"));
const code_1 = require("../const/code");
const symbol_1 = require("../const/symbol");
const cloudbase_1 = require("../cloudbase");
const utils_1 = require("./utils");
const request_1 = __importDefault(require("./request"));
const requestHook_1 = require("./requestHook");
const getWxCloudApiToken_1 = require("./getWxCloudApiToken");
const { version } = require('../../package.json');
class Request {
    constructor(args) {
        this.defaultEndPoint = 'tcb-admin.tencentcloudapi.com';
        this.inScfHost = 'tcb-admin.tencentyun.com';
        // private openApiHost: string = 'tcb-open.tencentcloudapi.com'
        this.urlPath = '/admin';
        this.defaultTimeout = 15000;
        this.timestamp = new Date().valueOf();
        this.tracingInfo = tracing_1.generateTracingInfo();
        this.args = args;
        this.config = args.config;
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
     *
     * 接口action
     */
    getAction() {
        const { params } = this.args;
        const { action } = params;
        return action;
    }
    /**
     * 获取
     */
    /**
     * 校验密钥和token是否存在
     */
    validateSecretIdAndKey() {
        const isInSCF = utils.checkIsInScf();
        const { secretId, secretKey } = this.config;
        if (!secretId || !secretKey) {
            if (isInSCF) {
                const envSecretId = process.env.TENCENTCLOUD_SECRETID;
                const envSecretKey = process.env.TENCENTCLOUD_SECRETKEY;
                const sessionToken = process.env.TENCENTCLOUD_SESSIONTOKEN;
                if (!envSecretId || !envSecretKey) {
                    throw utils_1.E(Object.assign(Object.assign({}, code_1.ERROR.INVALID_PARAM), { message: 'missing authoration key, redeploy the function' }));
                }
                else {
                    this.config = Object.assign({}, this.config, {
                        secretId: envSecretId,
                        secretKey: envSecretKey,
                        sessionToken: sessionToken
                    });
                    return;
                }
            }
            throw utils_1.E(Object.assign(Object.assign({}, code_1.ERROR.INVALID_PARAM), { message: 'missing secretId or secretKey of tencent cloud' }));
        }
    }
    /**
     *
     * 获取headers
     */
    getHeaders() {
        const config = this.config;
        const args = this.args;
        const isInSCF = utils.checkIsInScf();
        // Note: 云函数被调用时可能调用端未传递 SOURCE，TCB_SOURCE 可能为空
        const TCB_SOURCE = process.env.TCB_SOURCE || '';
        const SOURCE = isInSCF ? `${TCB_SOURCE},scf` : ',not_scf';
        // 默认
        const requiredHeaders = {
            'user-agent': `tcb-admin-sdk/${version}`,
            'x-tcb-source': SOURCE,
            'x-client-timestamp': this.timestamp
        };
        if (config.version) {
            requiredHeaders['x-sdk-version'] = config.version;
        }
        return Object.assign({}, config.headers, args.headers, requiredHeaders);
    }
    /**
     * 获取authorization
     */
    getAuthorization(params) {
        const headers = this.getHeaders();
        const method = this.getMethod();
        const { secretId, secretKey } = this.config;
        const authObj = {
            SecretId: secretId,
            SecretKey: secretKey,
            Method: method,
            Pathname: this.urlPath,
            Query: params,
            Headers: Object.assign({}, headers)
        };
        const auth = new auth_1.Auth(authObj);
        const authorization = auth.getAuth();
        return authorization;
    }
    /**
     * 获取url
     * @param action
     */
    getUrl(action) {
        const protocol = this.getProtocol();
        const isInSCF = utils.checkIsInScf();
        const { customEndPoint } = this.args;
        const { serviceUrl } = this.config;
        if (serviceUrl) {
            return serviceUrl;
        }
        if (customEndPoint) {
            return `${protocol}://${customEndPoint}${this.urlPath}`;
        }
        let url = `${protocol}://${this.defaultEndPoint}${this.urlPath}`;
        if (isInSCF) {
            url = `http://${this.inScfHost}${this.urlPath}`;
        }
        // if (action === 'wx.api' || action === 'wx.openApi') {
        //   url = `${protocol}://${this.openApiHost}${this.urlPath}`
        // }
        return url;
    }
    /**
     *  构造请求项
     */
    makeReqOpts(params) {
        const config = this.config;
        const args = this.args;
        const url = this.getUrl(params.action);
        const method = this.getMethod();
        const { eventId, seqId } = this.tracingInfo;
        const opts = {
            url,
            method,
            // 先取模块的timeout，没有则取sdk的timeout，还没有就使用默认值
            // timeout: args.timeout || config.timeout || 15000,
            timeout: this.getTimeout(),
            // 优先取config，其次取模块，最后取默认
            headers: this.getHeaders(),
            proxy: config.proxy
        };
        let urlStr = `&eventId=${eventId}&seqId=${seqId}`;
        const scfContext = cloudbase_1.CloudBase.scfContext;
        if (scfContext) {
            urlStr = `&eventId=${eventId}&seqId=${seqId}&scfRequestId=${scfContext.request_id}`;
        }
        if (opts.url.includes('?')) {
            opts.url = `${opts.url}${urlStr}`;
        }
        else {
            opts.url = `${opts.url}?${urlStr}`;
        }
        if (args.method == 'post') {
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
            opts.qs = params;
        }
        return opts;
    }
    /**
     * 设置超时warning
     */
    setSlowRequeryWarning(action) {
        const { seqId } = this.tracingInfo;
        const warnStr = `Your current request ${action ||
            ''} is longer than 3s, it may be due to the network or your query performance | [${seqId}]`;
        // 暂针对数据库请求
        const warnTimer = setTimeout(() => {
            console.warn(warnStr);
        }, 3000);
        return warnTimer;
    }
    /**
     * 构造发送请求
     */
    getOpts() {
        this.validateSecretIdAndKey();
        const args = this.args;
        const config = this.config;
        const { eventId } = this.tracingInfo;
        let params = Object.assign({}, args.params, {
            envName: config.envName,
            eventId,
            // wxCloudApiToken: process.env.WX_API_TOKEN || '',
            wxCloudApiToken: getWxCloudApiToken_1.getWxCloudApiToken(),
            // 对应服务端 wxCloudSessionToken
            tcb_sessionToken: process.env.TCB_SESSIONTOKEN || ''
        });
        // 取当前云函数环境时，替换为云函数下环境变量
        if (params.envName === symbol_1.SYMBOL_CURRENT_ENV) {
            params.envName = process.env.TCB_ENV || process.env.SCF_NAMESPACE;
        }
        // 过滤value undefined
        utils.filterUndefined(params);
        const authoration = this.getAuthorization(Object.assign({}, params));
        params.authorization = authoration;
        config.sessionToken && (params.sessionToken = config.sessionToken);
        params.sdk_version = version;
        // 对不参与签名项 进行合并
        if (args.unSignedParams) {
            params = Object.assign(params, args.unSignedParams);
        }
        const opts = this.makeReqOpts(params);
        return opts;
    }
}
exports.Request = Request;
// 业务逻辑都放在这里处理
exports.default = async (args) => {
    const req = new Request(args);
    const reqOpts = req.getOpts();
    const action = req.getAction();
    let reqHooks;
    let warnTimer = null;
    if (action === 'wx.openApi' || action === 'wx.wxPayApi') {
        reqHooks = {
            handleData: requestHook_1.handleWxOpenApiData
        };
    }
    if (action.indexOf('database') >= 0) {
        warnTimer = req.setSlowRequeryWarning(action);
    }
    if (reqHooks) {
        return await request_1.default(reqOpts, reqHooks);
    }
    try {
        return await request_1.default(reqOpts);
    }
    finally {
        if (warnTimer) {
            clearTimeout(warnTimer);
        }
    }
};
