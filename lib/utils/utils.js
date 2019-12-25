"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class TcbError extends Error {
    constructor(error) {
        super(error.message);
        this.code = error.code;
        this.message = error.message;
    }
}
exports.TcbError = TcbError;
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
exports.E = (errObj) => {
    return new TcbError(errObj);
};
exports.isArray = (arr) => {
    return arr instanceof Array;
};
exports.camSafeUrlEncode = (str) => {
    return encodeURIComponent(str)
        .replace(/!/g, '%21')
        .replace(/'/g, '%27')
        .replace(/\(/g, '%28')
        .replace(/\)/g, '%29')
        .replace(/\*/g, '%2A');
};
exports.map = (obj, fn) => {
    var o = exports.isArray(obj) ? [] : {};
    for (var i in obj) {
        if (obj.hasOwnProperty(i)) {
            o[i] = fn(obj[i], i);
        }
    }
    return o;
};
exports.clone = (obj) => {
    return exports.map(obj, function (v) {
        return typeof v === 'object' && v !== undefined && v !== null ? exports.clone(v) : v;
    });
};
exports.checkIsInScf = () => {
    return process.env.TENCENTCLOUD_RUNENV === 'SCF';
};
exports.delay = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};
