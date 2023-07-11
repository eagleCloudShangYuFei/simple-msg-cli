#!/usr/bin/env node
 // vim: set ft=javascript:

 (function() {
  var childProcess = require("child_process");
  var oldSpawn = childProcess.spawn;
  function mySpawn() {
      console.log('spawn called');
      console.log(arguments);
      var result = oldSpawn.apply(this, arguments);
      return result;
  }
  childProcess.spawn = mySpawn;
})();

const program = require('commander');
console.log('111');
program
  .version('1.5.0')
  .command('scan [path]', '扫描 React 项目')
  .command('pick', '替换文案')
  .command('export', '导出文案')
  .parse(process.argv);
