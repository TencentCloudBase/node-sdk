import { IErrorInfo } from '../type'

export class TcbError extends Error {
    public readonly code: string
    public readonly message: string
    public constructor(error: IErrorInfo) {
        super(error.message)
        this.code = error.code
        this.message = error.message
    }
}

export const filterValue = function filterValue(o, value) {
    for (let key in o) {
        if (o[key] === value) {
            delete o[key]
        }
    }
}

export const filterUndefined = function(o) {
    return filterValue(o, undefined)
}

// export const filterNull = function(o) {
//   return filterValue(o, null)
// }

// export const filterEmptyString = function(o) {
//   return filterValue(o, '')
// }

// export const warpPromise = function warp(fn) {
//   return function(...args) {
//     // 确保返回 Promise 实例
//     return new Promise((resolve, reject) => {
//       try {
//         return fn(...args)
//           .then(resolve)
//           .catch(reject)
//       } catch (e) {
//         reject(e)
//       }
//     })
//   }
// }

export const E = (errObj: IErrorInfo) => {
    return new TcbError(errObj)
}

export const isArray = arr => {
    return arr instanceof Array
}

export const camSafeUrlEncode = str => {
    return encodeURIComponent(str)
        .replace(/!/g, '%21')
        .replace(/'/g, '%27')
        .replace(/\(/g, '%28')
        .replace(/\)/g, '%29')
        .replace(/\*/g, '%2A')
}

export const map = (obj, fn) => {
    const o = isArray(obj) ? [] : {}
    for (let i in obj) {
        if (obj.hasOwnProperty(i)) {
            o[i] = fn(obj[i], i)
        }
    }
    return o
}

export const clone = obj => {
    return map(obj, function(v) {
        return typeof v === 'object' && v !== undefined && v !== null ? clone(v) : v
    })
}

export const checkIsInScf = () => {
    return process.env.TENCENTCLOUD_RUNENV === 'SCF'
}

export const delay = ms => {
    return new Promise(resolve => setTimeout(resolve, ms))
}

export function second(): number {
    // istanbul ignore next
    return Math.floor(new Date().getTime() / 1000)
}
