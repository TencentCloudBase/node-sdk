# Tencent Cloud Base(TCB) Server Node.js SDK

## 目录

- [介绍](#介绍)
- [安装](#安装)
- [文档](#文档)

## 介绍

TCB 提供开发应用所需服务和基础设施。CloudBase server node.js SDK 让你可以在服务端（如腾讯云云函数或 CVM 等）使用 Node.js 服务访问 CloudBase 的的服务。

需要 Node.js v8.0 及以上版本。

## 安装

server node.js SDK 可以通过`@cloudbase/node-sdk`来访问：

```base
npm install --save @cloudbase/node-sdk@latest
```

要在你的模块式使用模块可以

```js
var admin = require('@cloudbase/node-sdk')
```

或

```js
import tcb from '@cloudbase/node-sdk'
```

> ⚠️ 当您计划在项目中使用 node-sdk 替代 tcb-admin-node 时，请务必阅读[迁移文档](./docs/packageChange.md)

## 文档

- [初始化](docs/initialization.md)
- [存储](docs/storage.md)
- [数据库](docs/database.md)
- [云函数](docs/functions.md)
- [鉴权](./docs/auth.md)
- [环境](./docs/env.md)
