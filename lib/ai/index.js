"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const httpRequest_1 = __importDefault(require("../utils/httpRequest"));
const utils_1 = require("../utils/utils");
const code_1 = require("../const/code");
/**
 * 调用AI服务
 * @param {Object} param  AI 服务参数
 * @return {Promise}
 */
async function callAI(cloudbase, { param }, opts) {
    try {
        param = param ? JSON.stringify(param) : '';
    }
    catch (e) {
        throw e;
    }
    if (!param) {
        throw utils_1.E(Object.assign(Object.assign({}, code_1.ERROR.INVALID_PARAM), { message: '参数不能为空' }));
    }
    let params = Object.assign({}, {
        action: 'ai.invokeAI',
        param
    });
    return httpRequest_1.default({
        config: cloudbase.config,
        params,
        method: 'post',
        opts,
        headers: {
            'content-type': 'application/json'
        }
    });
}
exports.callAI = callAI;
