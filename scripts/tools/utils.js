const MiniCssExtractPlugin = require('mini-css-extract-plugin')
// 解析命令行参数
const argv = require('minimist')(process.argv.slice(2))
// 项目
const project = argv['project'] || 'src'
// 包分析
const analyze = argv['analyze'] || false
// 网址
const site = argv['site']
// 端口号
const port = argv['port']

exports.cssLoaders = (options = {}) => {
  const generateLoaders = loaders => {
    const sourceLoader = loaders.map(loader => {
      let extraParamChar
      if (/\?/.test(loader)) {
        loader = loader.replace(/\?/, '-loader?')
        extraParamChar = '&'
      } else {
        loader = loader + '-loader'
        extraParamChar = '?'
      }
      return loader + (options.sourceMap ? extraParamChar + 'sourceMap' : '')
    }).join('!')

    // 抽离 css
    if (options.extract) {
      return [MiniCssExtractPlugin.loader, sourceLoader].join('!')
    } else {
      return ['style-loader', sourceLoader].join('!')
    }
  }

  return {
    css: generateLoaders(['css', 'postcss']),
    postcss: generateLoaders(['css']),
    less: generateLoaders(['css', 'less']),
    sass: generateLoaders(['css', 'postcss', 'sass?indentedSyntax']),
    scss: generateLoaders(['css', 'postcss', 'sass']),
    stylus: generateLoaders(['css', 'stylus']),
    styl: generateLoaders(['css', 'stylus'])
  }
}

// 生成加载器
exports.styleLoaders = options => {
  const output = []
  const loaders = exports.cssLoaders(options)

  for (const extension of Object.keys(loaders)) {
    const loader = loaders[extension]
    output.push({
      test: new RegExp('\\.' + extension + '$'),
      loader: loader
    })
  }
  return output
}

// 导出命令行参数
exports.argv = { project, site, port, analyze }
