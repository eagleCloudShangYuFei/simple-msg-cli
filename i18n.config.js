
const _config = {
  "callStatement": "intl.formatMessage",
  "targetDir": "i18n-messages",
  "exclude": ['.umi', '.umi-production'],
  "callExpression": true,
  "autoZhKey": true,
  "autoTranslate": false,
}
const path = require('path');
module.exports = function () {
  let config = {};
  try {
    config = require(path.join(process.cwd(), 'i18n.config.json'));
  } catch(e) {
    config = {};
  }
  return Object.assign({}, _config, config);
}
