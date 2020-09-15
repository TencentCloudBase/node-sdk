import { IRequestInfo, IReqOpts, IReqHooks } from '../type/index';
export declare class Request {
    private args;
    private config;
    private opts;
    private urlPath;
    private defaultTimeout;
    private timestamp;
    private tracingInfo;
    private secretManager;
    private slowWarnTimer;
    private hooks;
    constructor(args: IRequestInfo);
    /**
     * 最终发送请求
     */
    request(): Promise<any>;
    setHooks(hooks: IReqHooks): void;
    getSeqId(): string;
    /**
     * 接口action
     */
    getAction(): string;
    /**
     * 设置超时warning
     */
    setSlowWarning(timeout: number): void;
    /**
     * 构造params
     */
    makeParams(): Promise<any>;
    /**
     *  构造请求项
     */
    makeReqOpts(params: any): Promise<IReqOpts>;
    /**
     * 协议
     */
    private getProtocol;
    /**
     * 请求方法
     */
    private getMethod;
    /**
     * 超时时间
     */
    private getTimeout;
    /**
     * 校验密钥和token是否存在
     */
    private validateSecretIdAndKey;
    /**
     *
     * 获取headers 此函数中设置authorization
     */
    private getHeaders;
    /**
     * 获取url
     * @param action
     */
    private getUrl;
}
declare const _default: (args: IRequestInfo) => Promise<any>;
export default _default;
