/**
 * OutputHtmlWebpack
 * 功能：模拟 HtmlWebpackPlugin 插件的功能
 *      在 Webpack 成功编译和输出了文件后执行发布操作，把输出的文件关联到 html
 * 使用：
 *  // 在初始化 OutputHtmlWebpack 时传入了一个参数，{key:value}；
    // key: 打包入口名称
    // value：
        {
            filename: 生成入口html路径
            template: 模版html路径
            path: 包路径
        },
 */
const fs = require('fs')
const path = require('path')
const HTMLParser = require('node-html-parser')

class OutputHtmlWebpack {
    constructor(entryhtml) {
        this.entryhtml = entryhtml
    }

    apply(compiler) {
        // done: 在成功构建并且输出了文件后，Webpack 即将退出时发生
        compiler.hooks.done.tap('EndWebpackPlugin',async (stats) => {
            // 获取入口 entrypoints
            const entrypoints = stats.toJson().entrypoints;

            // 配置打包后，包入口文件，以 [key: value] 形式，key：entry，value: chunk 列表
            // 例如："platform": ["vendors~index~login~platform.d92c60285ca500a3a231.bundle.js","platform.bundle.js"]
            const result = {};
            Object.entries(entrypoints).forEach(
                ([key, value]) => { result[key] = value.assets }
            );

            for(let key in result) { 
                // 包入口和传入的html入口一致，加载模版html(template),并生成包含入口 chunk 的完整html（filename）
                if(this.entryhtml && this.entryhtml[key]) {
                    const content = HTMLParser.parse(fs.readFileSync(this.entryhtml[key].template, 'utf-8'), {
                        lowerCaseTagName: false,  // 是否将标签名称转换为小写（严重影响性能)
                        script: true,            // 是否检索<script>中的内容（略微影响性能）
                        style: true,             // 是否检索<style>中的内容(略微影响性能)
                        pre: false                // 是否检索<pre - >中的内容(略微影响性能)
                    })
                    const root = content.querySelector('body')
                    result[key].forEach(filename => {
                        let script = HTMLParser.parse(` <script type="text/javascript" src="${this.entryhtml[key].path}${filename}"></script>`);
                        const arr = filename.split('.')
                        if (arr[arr.length-1] === 'css') {
                            script = HTMLParser.parse(` <link rel="stylesheet" type="text/css" href="${this.entryhtml[key].path}${filename}"/>`);
                        }
                        root.appendChild(script)
                    })
                    fs.writeFileSync(
                        this.entryhtml[key].filename,
                        `<!DOCTYPE html>\n${content}`,
                        (err) => {
                            if (err) console.log('++++++++++++++创建文件失败： ', err)
                            console.log('文件已被保存');
                        }
                    );
                }
            }
            // Write the manifest file
            // fs.writeFileSync(
            //     './log.json',
            //     JSON.stringify(result, null, 2),
            //     (err) => {
            //         if (err) throw err;
            //         console.log('文件已被保存');
            //     }
            // );
            // this.doneCallback(stats)
        })
        // failed: 在构建出现异常导致构建失败，Webpack 即将退出时发生
        compiler.hooks.failed.tap('EndWebpackPlugin', (err) => {
            // 在 failed 事件中回调 failCallback
            // this.failCallback(err)
        })
    }
}

// 导出插件
module.exports = OutputHtmlWebpack;
