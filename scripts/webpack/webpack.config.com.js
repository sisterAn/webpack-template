const path = require('path')
const webpack = require('webpack')
// 为模块提供中间缓存步骤，显著提高打包速度
const HardSourceWebpackPlugin = require('hard-source-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
// 多线程loader，用于提升构建速度
const HappyPack = require('happypack')
// node 提供的系统操作模块
const os = require('os');
//  构造出共享进程池，根据系统的内核数量，指定线程池个数，也可以其他数量
const happyThreadPool = HappyPack.ThreadPool({ size: os.cpus().length });
const createHappyPlugin = (id, loaders) => new HappyPack({
  // 用唯一的标识符 id 来代表当前的 HappyPack 是用来处理一类特定的文件
  id: id,
  // 如何处理 .js 文件，用法和 Loader 配置中一样
  loaders: loaders,
  // 其它配置项(可选)
  // 代表共享进程池，即多个 HappyPack 实例都使用同一个共享进程池中的子进程去处理任务，以防止资源占用过多
  threadPool: happyThreadPool,
  // 是否允许 HappyPack 输出日志，默认是 true
  verbose: true
  // threads：代表开启几个子进程去处理这一类型的文件，默认是3个，类型必须是整数
});
const glob = require('glob'); // Match files
const utils = require('../tools/utils')
const project = utils.argv.project // 项目

// 编译规则
const rules = [
  {
    // 这里编译 js、jsx
    // 注意：如果项目源码中没有 jsx 文件就不要写 /\.jsx?$/，提升正则表达式性能
    test: /\.(js|jsx)$/,
    use: ["happypack/loader?id=happy-babel"],
    // 排除 node_modules 目录下的文件
    // node_modules 目录下的文件都是采用的 ES5 语法，没必要再通过 Babel 去转换
    exclude: /node_modules/
  },
  {
    test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
    use: [
      {
        loader: 'url-loader',
        options: {
          name: 'asset/images/[name].[ext]',
          // 10KB 以下的文件采用 url-loader
          limit: 1024 * 10,
          // 否则采用 file-loader，默认值就是 file-loader 
          fallback: 'file-loader'
        }
      }
    ],
  },
  {
    test: /\.html$/,
    use: 'html-loader'
  },
]

const plugins = [
  // 优化 require
  new webpack.ContextReplacementPlugin(/moment[\/\\]locale$/, /en|zh/),
  // 用于提升构建速度
  createHappyPlugin('happy-babel', [{
    loader: 'babel-loader',
    options: {
      // babel-loader 支持缓存转换出的结果，通过 cacheDirectory 选项开启
      cacheDirectory: true,
      // Save disk space when time isn't as important
      cacheCompression: true,
      compact: true,
    }
  }]),
  // 打包缓存
  new HardSourceWebpackPlugin({
    // cacheDirectory是在高速缓存写入。默认情况下，将缓存存储在node_modules下的目录中
    // 'node_modules/.cache/hard-source/[confighash]'
    cacheDirectory: path.join(__dirname, '../../node_modules/.cache/hard-source/[confighash]'),
    // configHash在启动webpack实例时转换webpack配置，
    // 并用于cacheDirectory为不同的webpack配置构建不同的缓存
    configHash: function (webpackConfig) {
      // node-object-hash on npm can be used to build this.
      return require('node-object-hash')({
        sort: false
      }).hash(webpackConfig);
    },
    // 当加载器、插件、其他构建时脚本或其他动态依赖项发生更改时，
    // hard-source需要替换缓存以确保输出正确。
    // environmentHash被用来确定这一点。如果散列与先前的构建不同，则将使用新的缓存
    environmentHash: {
      root: process.cwd(),
      directories: [],
      files: ['package-lock.json', 'yarn.lock'],
    },
    // An object. 控制来源
    info: {
      // 'none' or 'test'.
      mode: 'none',
      // 'debug', 'log', 'info', 'warn', or 'error'.
      level: 'debug',
    },
    // Clean up large, old caches automatically.
    cachePrune: {
      // Caches younger than `maxAge` are not considered for deletion. They must
      // be at least this (default: 2 days) old in milliseconds.
      maxAge: 2 * 24 * 60 * 60 * 1000,
      // All caches together must be larger than `sizeThreshold` before any
      // caches will be deleted. Together they must be at least this
      // (default: 50 MB) big in bytes.
      sizeThreshold: 50 * 1024 * 1024
    },
  }),
  new HtmlWebpackPlugin({
    title: 'webpack',
    template: './src/index.html', //本地模板文件的位置，支持加载器(如handlebars、ejs、undersore、html等)，如比如 handlebars!src/index.hbs；
    filename: './index.html', //输出文件的文件名称，默认为index.html，不配置就是该文件名；此外，还可以为输出文件指定目录位置（例如'html/index.html'）
  }),
  // 清除原有打包文件
  new CleanWebpackPlugin({
    root: process.cwd(), // 根目录
    verbose: true, // 开启在控制台输出信息
    dry: false // 启用删除文件
  }),
]

module.exports = {
  // 入口文件
  entry: 
  { 
    "index": `./${project}/index.js`,
  },
  // glob.sync('./project/**/index.js').reduce((acc, path) => {
  //   const entry = path.replace('/index.js', '')
  //   acc[entry] = path
  //   console.log('-------acc: ', acc)
  //   return acc
  // }, {}),
  module: {
    // 项目中使用的 jquery 并没有采用模块化标准，webpack 忽略它
    // noParse: /jquery/,
    //设置所以编译文件的loader
    rules: rules,
  },
  resolve: {
    // 设置模块导入规则，import/require时会直接在这些目录找文件
    // 可以指明存放第三方模块的绝对路径，以减少寻找
    modules: [path.resolve(`${project}/components`), 'node_modules'],
    // import导入时省略后缀
    // 注意：尽可能的减少后缀尝试的可能性
    extensions: ['.js', '.jsx', '.react.js', '.css', '.json'],
    // import导入时别名，减少耗时的递归解析操作
    alias: {
      '@components': path.resolve(`${project}/components`),
      '@style': path.resolve('asset/style'),
    }
  },
  plugins: plugins,
  performance: {
    // 性能设置,文件打包过大时，不报错和警告，只做提示
    hints: false
  }
}
