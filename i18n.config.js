
const _config = {
  "callStatement": "intl.formatMessage",
  "targetDir": "i18n-messages",
  "exclude": [],
  "callExpression": false,
  "autoZhKey": true,
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
