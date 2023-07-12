### 一个简单国际化文案提取工具
* eagle-pick scan [path] 提取path目录下所有文件的文案，并生成sourcemap.txt 和 zh-CH.json 文案
* eagle-pick pick 替换zh-CH.json 下的所有目录文案
* eagle-pick export 导出文案

### 使用方法
```
npm i simple-msg-cli -g 进行全区安装

// 扫描对应的path目录 eagle-pick scan ./src
eagle-pick scan [path]

// 替换
eagle-pick pick

// 再进行翻译导出
eagle-pick export

// 由于googleTranslate api数量限制，文案量过大会出错
```

```json
// i18n.config.json 配置
{
  "callStatement": "intl.formatMessage",
  "targetDir": "i18n-messages",
  "exclude": [".umi", ".umi-production"],
  "callExpression": true, // 函数调用翻译
  "autoZhKey": true,
  "autoTranslate": true,  // 自动翻译
}
```