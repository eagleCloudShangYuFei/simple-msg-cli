#!/usr/bin/env node
// vim: set ft=javascript:

const program = require('commander');
const scan = require('../lib/utils');

console.log('process.argv', process.argv);
console.log('__dirname', __dirname);
console.log('process.cwd', process.cwd());

program.parse(process.argv);

const path = program.args[0] || '.';

scan.run(path);
