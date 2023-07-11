#!/usr/bin/env node
// vim: set ft=javascript:

const fs = require('fs');
const path = require('path');
const config = require('../i18n.config')();
const { translate } = require('@vitalets/google-translate-api')
const googleTranslator = (text) => translate(
  text,
  { from: 'zh-CN', to: 'en-US' },
  // {
  //   agent: tunnel.httpsOverHttp({
  //     proxy: {
  //       host: '127.0.0.1',// 代理 ip
  //       port: 7890, // 代理 port
  //       headers: {
  //         'User-Agent': 'Node'
  //       }
  //     }
  //   })
  // }
)

const dir = config.targetDir;

const targetPath = `${dir}/zh_CN.json`;
const targetEnPath = `${dir}/en_US.json`;

const srcPath = path.join(process.cwd(), dir, 'zh-CH.json');
let data = [];
try {
  data = require(srcPath);
} catch(e) {
  console.log('获取映射文件出错！', e);
  return;
}
const result = {};

data.forEach(d=> {
  if (result[d.id]) return console.log(`"${d.defaultMessage}"与"${result[d.id]}" key 值相同，请修改！`);
  result[d.id] = d.defaultMessage
});

const translateRun = async (inputJson) => {
  const sourceKeyValues = Object.entries(inputJson)
  const resultJson = {}
  for (let i = 0; i < sourceKeyValues.length; i++) {
    const [key, value] = sourceKeyValues[i]
    const { text } = await googleTranslator(value)
    resultJson[key] = text
  }
  return resultJson
}

// DONE: 重写 targetPath 文件
fs.writeFile(targetPath, JSON.stringify(result, null, '\t'), function(err) {
  if (err) return console.error(err);
  console.log('----导出到 zh_CN.js ----')
});

translateRun(result).then(resultJson => {
  
  fs.writeFile(targetEnPath, JSON.stringify(resultJson, null, '\t'), (err) => {
    if (err) return console.error(err);
    console.log('----导出到 en_US.js ----')
  });
})
