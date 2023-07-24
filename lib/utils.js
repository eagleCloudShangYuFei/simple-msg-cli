const { glob } = require('glob');
const transformFileSync = require('@babel/core').transformFileSync;
const presetReact = require('@babel/preset-react');
const presetTypescript = require('@babel/preset-typescript');

const tsTransform = require('@babel/plugin-transform-typescript');
const tsSyntax = require('@babel/plugin-syntax-typescript');
const proDecorator = require('@babel/plugin-proposal-decorators');
const proClass = require('@babel/plugin-proposal-class-properties');
const objSpred = require('@babel/plugin-proposal-object-rest-spread');

const fs = require('fs');
const rimraf = require('rimraf');
const config = require('../i18n.config.js')();
const crypto = require('crypto');

const textArr = [];
const zhCH = new Map();

const targetDir = config.targetDir;
const exclude = config.exclude;
const callExpression = config.callExpression;
const autoZhKey = config.autoZhKey;

async function run(pl) {
    const pathList = pl?.split?.(',')?.filter?.(Boolean) || [];

    let files = [];
    for (const path of pathList) {
        const f = await glob(`${path}/**/*.{js,jsx,ts,tsx}`, { ignore: exclude.map(pattern=>`${path}/${pattern}`) });
        files.push(...(f || []));
    }

    files.forEach(filename => {
        if (filename.includes('node_modules')) {
            return;
        }
        // 如果文件目录带了_，我认为他是测试用例
        if (filename.startsWith('_')){
            return;
        }
        transformFileSync(filename, {
            presets: [
                [presetTypescript, { allExtensions: true, isTSX: true }], 
                // [
                //     "@babel/env",
                //     // {
                //     //     "targets": "chrome > 58",
                //     //     "modules": false,
                //     //     "useBuiltIns": "usage",
                //     //     loose: true,
                //     // }
                // ],
                presetReact
            ],
            plugins: [
                tsTransform,
                tsSyntax,
                [proDecorator, { "legacy": true }],
                proClass,
                objSpred,
                // "@babel/plugin-syntax-dynamic-import",
                scan,
            ]
        });
    });

    // 这里写到text中，为了避免重复
    // 创建文件夹
    rimraf.sync(targetDir);
    fs.mkdirSync(targetDir);
    fs.appendFile(`${targetDir}/sourcemap.txt`, textArr.map((item, i)=>`${item}#${i}\n`).join(''),  function(err) {
        if (err) {
            return console.error(err);
        }
        console.log(`----共扫描中文文案 ${textArr.length} 条----`);
    });
    fs.appendFile(`${targetDir}/zh-CH.json`, `${JSON.stringify([...zhCH.values()], null, '\t')}`,  function(err) {
        if (err) {
            return console.error(err);
        }
        console.log(`----去重后中文文案为 ${zhCH.size} 条----`);
    });
}


/**
 * 判断替换情况
 * - '中文' `中文`
 * - <div>中文</div> <Modal title="中文" /> <Modal title={'中文'} />
 * - <div>{'中文 ${s}'}</div>
 */

function scan({ types: t }) {
    return {
        visitor: {
            JSXAttribute(path) {
                const { node } = path;
                if (node.name.name !== 'defaultMessage' && node.value && node.value.value) {
                    detectChinese(node.value.value, path, 'jsx', 'JSXAttribute');
                }
            },
            JSXText(path) {
                const { node } = path;
                detectChinese(node.value, path, 'jsx', 'JSXText');
            },
            AssignmentExpression(path) {
                detectChinese(path.node.right.value, path, 'text', 'AssignmentExpression');
            },
            ObjectProperty(path) {
                detectChinese(path.node.value.value, path, 'text', 'ObjectProperty');
            },
            ArrayExpression(path) {
                path.node.elements.forEach(item => {
                    if (item.value) {
                        detectChinese(item.value, Object.assign({}, path, {node: item}), 'text', 'ArrayExpression');
                    }
                })
            },
            // 新增：new Person('小红')
            // NewExpression(path) {
            //     path.node.arguments.forEach(item =>{
            //         detectChinese(item && item.value, path, 'text', 'NewExpression');
            //     });
            // },
            // 新增：函数调用；cb('这是一个错误')
            CallExpression(path) {
                if (path.node.callee && path.node.callee.object) {
                    if (path.node.callee.object.name === 'console') {
                        return;
                    }
                    if (path.node.callee.object.name === 'React') {
                        return;
                    }
                }
                
                path.node.arguments.forEach(item =>{
                    callExpression && detectChinese(item && item.value, path, 'text', 'CallExpression');
                });
            },
            // 新增：case '这是中文'；switchStatement, 
            // SwitchCase(path) {
            //     if (path.node && path.node.test) {
            //         detectChinese(path.node.test.value, path, 'text', 'SwitchCase');
            //     }
            // },
            // StringLiteral(path) {
            //     const { node, parent } = path;
            //     if (parent?.type === 'JSXExpressionContainer') {
            //         detectChinese(node.value, path, 'text', 'Literal');
            //     }
            // },

            JSXExpressionContainer(path) {
                const { node } = path;
                if (node.expression.type === 'StringLiteral') {
                    const expression = node.expression;
                    detectChinese(expression.value, path, 'text', 'StringLiteral');
                }
            }
        },

    }
}

function detectChinese(text, path, type, babelType) {
    if (/[\u4e00-\u9fa5]/.test(text)) {
        report(text, path, type, babelType)
    }
}

function randomNumStr(count = 6) {
    const arr = [];
    for (let i = 0; i < count; i++) {
        arr.push(Math.random() * 100 >> 0)
    }
    return arr.join('').slice(0, 6);
}

function report(text, path, type, babelType) {
    const { node } = path;

    let zhText = text.replace(/"/g,'\\\"');
    

    const loc = node?.loc;
    if (loc && zhText) {
        const [pre] = zhText?.split?.(zhText?.trim?.()) || [];
        let num = 0;
        if (pre && typeof pre === 'string') {
            for (const char of pre) {
                if (char === '\n') {
                    num += 1;
                }
            }
        }

        if (num) {
            loc.start.line += num;
            loc.end.line += num;
        }
    }

    const filename = path.hub.file.opts.filename;
    const location = `${filename}#${loc ? loc.start.line : '!!!'}#${loc ? loc.start.column : '!!!'}`;

    zhText = type == 'jsx' ? zhText.trim() : zhText;

    const sourceText = `${zhText}#${type}#${location}`;
    let notExist = false;
    if (type == 'text' && !~textArr.indexOf(`${zhText}#text#${location}`) && !~textArr.indexOf(`${zhText}#jsx#${location}`)) {
        notExist = true;
    } else if (type == 'jsx' && !~textArr.indexOf(`${zhText}#jsx#${location}`)) {
        notExist = true;
    }
    
    const filenameList = filename?.split(/\\|\/|\-/) || [];
    let ids = filenameList?.slice?.(-5, -1) || [];
    const md5 = crypto.createHash('md5');
    const md5Hex = md5.update(zhText).digest('hex');

    ids = ids?.map?.(_ => _?.slice(0, 5)) || [];

    ids.push(md5Hex.slice(0, 6));
    ids.push(randomNumStr());
    ids.push(md5Hex.slice(-6));

    if (notExist) {
        // 没有扫描过
        console.log(sourceText+'#'+babelType);

        textArr.push(sourceText);
        // 中文文案已存在
        if (zhCH.has(zhText)) {
            const data = zhCH.get(zhText);
            data.source.push({type, location});
            zhCH.set(zhText, data);
        } else {
            // 中文文案不存在
            zhCH.set(zhText, {
                id: ids.join?.('.')?.toLocaleLowerCase?.() || '',
                defaultMessage: zhText,
                source: [{
                    type,
                    location
                }]
            });
        }
    }
}

module.exports = {
    run,
};
