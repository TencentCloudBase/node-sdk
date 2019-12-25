/// <reference types="node" />
import { IRequestInfo, IReqOpts } from '../type/index';
export declare class Request {
    private args;
    private config;
    private defaultEndPoint;
    private inScfHost;
    private urlPath;
    private defaultTimeout;
    private timestamp;
    private tracingInfo;
    constructor(args: IRequestInfo);
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
     *
     * 接口action
     */
    getAction(): string;
    /**
     * 获取
     */
    /**
     * 校验密钥和token是否存在
     */
    private validateSecretIdAndKey;
    /**
     *
     * 获取headers
     */
    private getHeaders;
    /**
     * 获取authorization
     */
    private getAuthorization;
    /**
     * 获取url
     * @param action
     */
    private getUrl;
    /**
     *  构造请求项
     */
    private makeReqOpts;
    /**
     * 设置超时warning
     */
    setSlowRequeryWarning(action: string): NodeJS.Timer;
    /**
     * 构造发送请求
     */
    getOpts(): IReqOpts;
}
declare const _default: (args: IRequestInfo) => Promise<any>;
export default _default;
