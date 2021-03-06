# 登录鉴权

## getUserInfo

#### 1. 接口描述

接口功能：获取用户信息

接口声明：`getUserInfo(): Object`

#### 2. 输入参数

无

#### 3. 返回结果

| 字段         | 类型   | 必填 | 说明                                        |
| ------------ | ------ | ---- | ------------------------------------------- |
| openId       | string | 是   | 微信 openId，非微信授权登录则空             |
| appId        | string | 是   | 微信 appId，非微信授权登录则空              |
| uid          | string | 是   | 用户唯一 ID                                 |
| customUserId | string | 是   | 开发者自定义的用户唯一 id，非自定义登录则空 |

#### 4. 示例代码

```js
const tcb = require('@cloudbase/node-sdk')
const app = tcb.init({ env: 'xxx' })
const auth = app.auth()

exports.main = async (event, context) => {
  const {
    openId, //微信openId，非微信授权登录则空
    appId, //微信appId，非微信授权登录则空
    uid, //用户唯一ID
    customUserId //开发者自定义的用户唯一id，非自定义登录则空
  } = auth.getUserInfo()
  console.log(openId, appId, uid, customUserId)
}
```

## getClientIP

#### 1. 接口描述

接口功能：获取客户端 IP

接口声明：`getClientIP(): string`

#### 2. 输入参数

无

#### 3. 返回结果

| 字段 | 类型   | 必填 | 说明      |
| ---- | ------ | ---- | --------- |
| -    | string | 是   | 客户端 IP |

#### 4. 示例代码

```js
const tcb = require('@cloudbase/node-sdk')
const app = tcb.init({ env: 'xxx' })
const auth = app.auth()

exports.main = async (event, context) => {
  const ip = auth.getClientIP() // string
  console.log(ip)
}
```

## createTicket

#### 1. 接口描述

接口功能：获取自定义登录的登录凭据 ticket

接口声明：`createTicket(): string`

#### 2. 输入参数

| 字段         | 类型   | 必填 | 说明                           |
| ------------ | ------ | ---- | ------------------------------ |
| customUserId | string | 是   | 开发者自定义的用户唯一 id      |
| option       | string | 是   | 微信 appId，非微信授权登录则空 |

#### option

| 字段    | 类型   | 必填 | 说明                    |
| ------- | ------ | ---- | ----------------------- |
| refresh | number | 否   | access_token 的刷新时间 |
| expire  | number | 否   | access_token 的过期时间 |

#### 3. 返回结果

| 字段 | 类型   | 必填 | 说明                  |
| ---- | ------ | ---- | --------------------- |
| -    | string | 是   | 自定义登录凭据 ticket |

#### 4. 示例代码

```js
const tcb = require('@cloudbase/node-sdk')
const app = tcb.init({ env: 'xxx' })

const auth = app.auth()

const customUserId = '123456' // 开发者自定义的用户唯一id

const ticket = auth.createTicket(customUserId, {
  refresh: 3600 * 1000 // access_token的刷新时间
})

console.log(ticket)
```
