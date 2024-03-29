# 初始化

## init

#### 1. 接口描述

接口功能：SDK 实例初始化

接口声明：`init(object: Object): Promise<Object>`

#### 2. 输入参数

| 字段        | 类型   | 必填 | 说明                                                                                                                                 |
| ----------- | ------ | ---- | ------------------------------------------------------------------------------------------------------------------------------------ |
| secretId    | string | 否   | 腾讯云 API 固定密钥对，在云函数内执行可不填。[前往获取](https://console.cloud.tencent.com/cam/capi)                                  |
| secretKey   | string | 否   | 同上                                                                                                                                 |
| env         | string | 否   | TCB 环境 ID，不填使用默认环境                                                                                                        |
| proxy       | string | 否   | 调用接口时使用的 http 代理 url                                                                                                       |
| timeout     | number | 否   | 调用接口的超时时间（ms），默认为 5000，即 5 秒                                                                                       |
| credentials | object | 否   | Cloudbase 私钥，包含 `private_key` 和 `private_key_id` 两个字符串，可以通过[云开发控制台](https://console.cloud.tencent.com/tcb)获取 |
| version     | string | 否   | 版本号，依赖项目的版本号                                                                                                             |

#### 3. 返回结果

| 字段 | 类型   | 必填 | 说明         |
| ---- | ------ | ---- | ------------ |
| -    | Object | 是   | tcb 实例对象 |

#### 4. 示例代码

```javascript
// 初始化示例
const tcb = require('@cloudbase/node-sdk')
// 初始化资源

// 云函数下不需要secretId和secretKey。
// env如果不指定将使用默认环境
const app = tcb.init({
  secretId: 'xxxxx',
  secretKey: 'xxxx',
  env: 'xxx'
})

//云函数下使用默认环境
const app = tcb.init()

//云函数下指定环境
const app = tcb.init({
  env: 'xxx'
})

//获取执行当前云函数的环境
const currentEnv = tcb.SYMBOL_CURRENT_ENV

//云函数下指定环境为当前的执行环境
const app = tcb.init({
  env: currentEnv
})

//修改请求超时时间
const app = tcb.init({
  timeout: 5000
})

//使用多个环境
//初始化环境'xx'和'zz'
const app1 = tcb.init({
  env: 'xx'
})

const app2 = tcb.init({
  env: 'zz'
})
```
