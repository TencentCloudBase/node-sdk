import jwt from 'jsonwebtoken'
import { E } from '../utils/utils'
import { ERROR } from '../const/code'
import { CloudBase } from '../cloudbase'

const checkCustomUserIdRegex = /^[a-zA-Z0-9_\-#@~=*(){}[\]:.,<>+]{4,32}$/

function validateUid(uid) {
    if (typeof uid !== 'string') {
        throw E({ ...ERROR.INVALID_PARAM, message: 'uid must be a string' })
    }
    if (!checkCustomUserIdRegex.test(uid)) {
        throw E({ ...ERROR.INVALID_PARAM, message: `Invalid uid: "${uid}"` })
    }
}

export function auth(cloudbase: CloudBase) {
    return {
        getUserInfo() {
            const openId = process.env.WX_OPENID || ''
            const appId = process.env.WX_APPID || ''
            const uid = process.env.TCB_UUID || ''
            const customUserId = process.env.TCB_CUSTOM_USER_ID || ''

            return {
                openId,
                appId,
                uid,
                customUserId
            }
        },
        getClientIP() {
            return process.env.TCB_SOURCE_IP || ''
        },
        createTicket: (uid, options: any = {}) => {
            validateUid(uid)
            const timestamp = new Date().getTime()
            const { credentials, envName } = cloudbase.config
            if (!envName) {
                throw new Error('no env in config')
            }
            const { refresh = 3600 * 1000, expire = timestamp + 7 * 24 * 60 * 60 * 1000 } = options
            const token = jwt.sign(
                {
                    alg: 'RS256',
                    env: envName,
                    iat: timestamp,
                    exp: timestamp + 10 * 60 * 1000, // ticket十分钟有效
                    uid,
                    refresh,
                    expire
                },
                credentials.private_key,
                { algorithm: 'RS256' }
            )

            return credentials.private_key_id + '/@@/' + token
        }
    }
}
