let localConfig
try {
  localConfig = require('./config')
} catch (e) {
  throw Error('请在本地config.js设置相关配置信息')
}
module.exports = localConfig
