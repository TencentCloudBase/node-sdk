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
| region      | string | 否   | 指定地域，目前支持的地域列表[参考](https://cloud.tencent.com/document/product/876/51107)，云函数环境下默认取当前云函数环境地域       |

#### 3. 返回结果

| 字段 | 类型   | 必填 | 说明         |
| ---- | ------ | ---- | ------------ |
| -    | Object | 是   | tcb 实例对象 |

#### 4. 示例代码

```javascript
// 初始化示例
const tcb = require("@cloudbase/node-sdk");
// 初始化资源

// 云函数下不需要secretId和secretKey。
// env如果不指定将使用默认环境
const app = tcb.init({
  secretId: "xxxxx",
  secretKey: "xxxx",
  env: "xxx"
});

//云函数下使用默认环境
const app = tcb.init();

//云函数下指定环境
const app = tcb.init({
  env: "xxx"
});

//获取执行当前云函数的环境
const currentEnv = tcb.SYMBOL_CURRENT_ENV;

//云函数下指定环境为当前的执行环境
const app = tcb.init({
  env: currentEnv
});

//修改请求超时时间
const app = tcb.init({
  timeout: 5000
});

//使用多个环境
//初始化环境'xx'和'zz'
const app1 = tcb.init({
  env: "xx"
});

const app2 = tcb.init({
  env: "zz"
});
```

#### 地域

指定 region 时，必须与当前环境所属地域信息一致，示例如下：

假设当前有上海地域的环境 env-shanghai，广州地域的环境 env-guangzhou，则正确的用法为

```js
// 假设在上海地域 云函数下，则默认 region 为上海，信息一致
const tcb = require("@cloudbase/node-sdk");
const app = tcb.init({
  env: "env-shanghai"
});
```

```js
// 假设在上海地域 云函数下，指定上海 region
const tcb = require("@cloudbase/node-sdk");
const app = tcb.init({
  env: "env-shanghai",
  region: "ap-shanghai"
});
```

```js
// 假设在上海地域 云函数下，同时指定广州 region 及 广州 env
const tcb = require("@cloudbase/node-sdk");
const app = tcb.init({
  env: "env-guangzhou",
  region: "ap-guangzhou"
});
```

::: tip 提示
当前使用的环境所属地域，必须与当前指定的地域信息一致！
:::
