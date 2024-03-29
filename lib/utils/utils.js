"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cloudbase_1 = require("../cloudbase");
const metadata_1 = require("./metadata");
class TcbError extends Error {
    constructor(error) {
        super(error.message);
        this.code = error.code;
        this.message = error.message;
        this.requestId = error.requestId;
    }
}
exports.TcbError = TcbError;
function isAppId(appIdStr) {
    return /^[1-9][0-9]{4,64}$/gim.test(appIdStr);
}
exports.isAppId = isAppId;
exports.filterValue = function filterValue(o, value) {
    for (let key in o) {
        if (o[key] === value) {
            delete o[key];
        }
    }
};
exports.filterUndefined = function (o) {
    return exports.filterValue(o, undefined);
};
exports.E = (errObj) => {
    return new TcbError(errObj);
};
function isNonEmptyString(str) {
    return typeof str === 'string' && str !== '';
}
exports.isNonEmptyString = isNonEmptyString;
function checkIsInScf() {
    // TENCENTCLOUD_RUNENV
    return process.env.TENCENTCLOUD_RUNENV === 'SCF';
}
exports.checkIsInScf = checkIsInScf;
function checkIsInEks() {
    // EKS_CLUSTER_ID=cls-abcdefg
    // EKS_LOGS_xxx=
    // return isNonEmptyString(process.env.EKS_CLUSTER_ID)
    return !!process.env.KUBERNETES_SERVICE_HOST;
}
exports.checkIsInEks = checkIsInEks;
const kSumeruEnvSet = new Set(['formal', 'pre', 'test']);
function checkIsInSumeru() {
    // SUMERU_ENV=formal | test | pre
    return kSumeruEnvSet.has(process.env.SUMERU_ENV);
}
exports.checkIsInSumeru = checkIsInSumeru;
async function checkIsInTencentCloud() {
    return isNonEmptyString(await metadata_1.lookupAppId());
}
exports.checkIsInTencentCloud = checkIsInTencentCloud;
function second() {
    // istanbul ignore next
    return Math.floor(new Date().getTime() / 1000);
}
exports.second = second;
function processReturn(throwOnCode, res) {
    if (throwOnCode === false) {
        // 不抛报错，正常return，兼容旧逻辑
        return res;
    }
    throw exports.E(Object.assign({}, res));
}
exports.processReturn = processReturn;
function getServerInjectUrl() {
    const tcbContextConfig = getTcbContextConfig();
    return tcbContextConfig['URL'] || '';
}
exports.getServerInjectUrl = getServerInjectUrl;
function getTcbContextConfig() {
    try {
        const { TCB_CONTEXT_CNFG } = cloudbase_1.CloudBase.getCloudbaseContext();
        if (TCB_CONTEXT_CNFG) {
            // 检查约定环境变量字段是否存在
            return JSON.parse(TCB_CONTEXT_CNFG);
        }
        return {};
    }
    catch (e) {
        /* istanbul ignore next */
        console.log('parse context error...');
        /* istanbul ignore next */
        return {};
    }
}
exports.getTcbContextConfig = getTcbContextConfig;
/* istanbul ignore next */
function getWxUrl(config) {
    const protocal = config.isHttp === true ? 'http' : 'https';
    let wxUrl = protocal + '://tcb-open.tencentcloudapi.com/admin';
    if (checkIsInScf()) {
        wxUrl = 'http://tcb-open.tencentyun.com/admin';
    }
    return wxUrl;
}
exports.getWxUrl = getWxUrl;
function checkIsInternal() {
    return checkIsInScf() || checkIsInEks() || checkIsInSumeru();
}
exports.checkIsInternal = checkIsInternal;
function checkIsInternalAsync() {
    return checkIsInternal() ? Promise.resolve(true) : checkIsInTencentCloud();
}
exports.checkIsInternalAsync = checkIsInternalAsync;
function getCurrRunEnvTag() {
    if (checkIsInScf()) {
        return 'scf';
    }
    else if (checkIsInEks()) {
        return 'eks';
    }
    else if (checkIsInSumeru()) {
        return 'sumeru';
    }
    else if (checkIsInTencentCloud()) {
        return 'tencentcloud';
    }
    return 'unknown';
}
exports.getCurrRunEnvTag = getCurrRunEnvTag;
