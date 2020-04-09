"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const utils_1 = require("../utils/utils");
const code_1 = require("../const/code");
const checkCustomUserIdRegex = /^[a-zA-Z0-9_\-#@~=*(){}[\]:.,<>+]{4,32}$/;
function validateUid(uid) {
    if (typeof uid !== 'string') {
        throw utils_1.E(Object.assign(Object.assign({}, code_1.ERROR.INVALID_PARAM), { message: 'uid must be a string' }));
    }
    if (!checkCustomUserIdRegex.test(uid)) {
        throw utils_1.E(Object.assign(Object.assign({}, code_1.ERROR.INVALID_PARAM), { message: `Invalid uid: "${uid}"` }));
    }
}
function auth(cloudbase) {
    return {
        getUserInfo() {
            const openId = process.env.WX_OPENID || '';
            const appId = process.env.WX_APPID || '';
            const uid = process.env.TCB_UUID || '';
            const customUserId = process.env.TCB_CUSTOM_USER_ID || '';
            return {
                openId,
                appId,
                uid,
                customUserId
            };
        },
        getClientIP() {
            return process.env.TCB_SOURCE_IP || '';
        },
        createTicket: (uid, options = {}) => {
            validateUid(uid);
            const timestamp = new Date().getTime();
            const { credentials, envName } = cloudbase.config;
            if (!envName) {
                throw new Error('no env in config');
            }
            const { refresh = 3600 * 1000, expire = timestamp + 7 * 24 * 60 * 60 * 1000 } = options;
            const token = jsonwebtoken_1.default.sign({
                alg: 'RS256',
                env: envName,
                iat: timestamp,
                exp: timestamp + 10 * 60 * 1000,
                uid,
                refresh,
                expire
            }, credentials.private_key, { algorithm: 'RS256' });
            return credentials.private_key_id + '/@@/' + token;
        }
    };
}
exports.auth = auth;
