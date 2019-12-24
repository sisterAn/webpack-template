const path = require('path')
const webpack = require('webpack');
const merge = require('webpack-merge');
const glob = require('glob'); // Match files
// 抽离 css
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
// 压缩 css
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
// 压缩 js（多进程并行处理压缩）
const ParallelUglifyPlugin = require('webpack-parallel-uglify-plugin');
// 将 JavaScript 或 CSS 资产添加到 html-webpack-plugin 生成的 HTML 中
const AddAssetHtmlPlugin = require('add-asset-html-webpack-plugin')
// 分析包内容
var BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
// 分析打包时间
const SpeedMeasurePlugin = require("speed-measure-webpack-plugin");
const smp = new SpeedMeasurePlugin();
const common = require('./webpack.config.com.js');
const utils = require('../tools/utils')
const config = require('../../config')
const analyze = utils.argv.analyze // 分析包
const dllConfig = config.dlls.dllPlugin.defaults;
const dllPath = path.resolve(dllConfig.devPath);

let plugins = [
	//webpack编译过程中设置全局变量process.env
	// new webpack.DefinePlugin({
	// 	'process.env': { 
	// 		// 或  '"production"' ，环境变量的值需要是一个由双引号包裹的字符串
	// 		NODE_ENV: JSON.stringify('production')  
	// 	}
	// }),
	// 由于我们使用 NODE_ENV=production webpack ... 启动 NODE_ENV=development
	// 所以，也可以使用 new webpack.EnvironmentPlugin(['NODE_ENV'])
	// 在 webpack4 中 mode: 'production' 已经默认配置了 process.env.NODE_ENV = 'production'
	// 所以，可以不定义

	// 抽离 css
	new MiniCssExtractPlugin({
		filename: '[name]_[hash:5].css',
		chunkFilename: '[id]_[hash:5].css',
		disable: false, //是否禁用此插件
		allChunks: true,
	}),
	// 压缩优化 css
	new OptimizeCssAssetsPlugin({
		// ExtractTextPlugin 或 MiniCssExtractPlugin导出的文件名
		assetNameRegExp: /\.css$/g,
		// 用于优化/最小化CSS的CSS处理器，默认为cssnano
		cssProcessor: require('cssnano'),
		cssProcessorPluginOptions: {
			preset: ['default', {
				discardComments: {
				removeAll: true
				}
			}],
		},
		// 控制插件是否可以将消息打印到控制台，默认为 true
		canPrint: true
	}),
	// 使用 ParallelUglifyPlugin 并行压缩输出的 JS 代码
	new ParallelUglifyPlugin({
		// 传递给 UglifyJS 的参数
		uglifyJS: {
			// 在UglifyJs删除没有用到的代码时不输出警告
			warnings: false,
			compress: {
				drop_debugger: true,
				// 删除所有的 `console` 语句，可以兼容ie浏览器
				drop_console: true,
				// 内嵌定义了但是只用到一次的变量
				collapse_vars: true,
				// 提取出出现多次但是没有定义成变量去引用的静态值
				reduce_vars: true,
			},
			output: {
				// 最紧凑的输出
				beautify: false,
				// 删除所有的注释
				comments: false
			}
		}
	}),
]

// // 引入所有的 dll 动态链接库
// // 本项目中使用的是 HardSourceWebpackPlugin，所以这个弃用
// const manifests = glob.sync(path.resolve(`${dllPath}/*Dll.json`));
// manifests.forEach(item => {
//   plugins.push(new webpack.DllReferencePlugin({
//     context: process.cwd(),
//     manifest: item,
//   }))
// })
// // 对 js
// glob.sync(`${dllConfig.buildPath}/reactDll*.dll.js`).forEach((dllPath) => {
//   plugins.push(
//     new AddAssetHtmlPlugin({
//       filepath: dllPath,
//       includeSourcemap: false,
//       publicPath: './js',
//       context: process.cwd(),
//       outputPath: 'js',
//       typeOfAsset: 'js'
//     })
//   );
// });
// // 对 css
// glob.sync(`${dllConfig.buildPath}` + '/*.dll.css').forEach((dllPath) => {
//   plugins.push(
//     new AddAssetHtmlPlugin({
//       filepath: dllPath,
//       includeSourcemap: false,
//       publicPath: './stylesheet',
//       context: process.cwd(),
//       outputPath: 'stylesheet',
//       typeOfAsset: 'css'
//     })
//   );
// });

// analyze 为 true，则开启 BundleAnalyzerPlugin
if (analyze) {
	plugins.push(new BundleAnalyzerPlugin())
}


const prodWebpackConfig = merge(common, {
	mode: 'production',
	module: { // 抽离 css
		rules: utils.styleLoaders({
        sourceMap: false,
        extract: true,
        publicPath: '../'
      })
	},
	// optimization: {
	// 	minimize: true,
	// 	splitChunks: { // 分块

	// 		// 默认为 async （只针对异步块进行拆分），值为 all/initial/async/function(chunk) ,值为 function 时第一个参数为遍历所有入口 chunk 时的 chunk 模块，chunk._modules 为 chunk 所有依赖的模块，
	// 		// 通过 chunk 的名字和所有依赖模块的 resource 可以自由配置,会抽取所有满足条件 chunk 的公有模块，以及模块的所有依赖模块，包括 css
	// 		chunks: 'all',

	// 		// minRemainingSize: 0,
	// 		// webpack5 中引入，限制拆分后剩余的块的最小大小，避免大小为零的模块
	// 		// 仅仅对剩余的最后一个块有效
	// 		// 在“开发”模式下默认为0 
	// 		// 在其他情况下，默认值为 minSize 的值
	// 		// 因此除极少数需要深度控制的情况外，无需手动指定它

	// 		// 旨在与HTTP/2和长期缓存一起使用 
	// 		// 它增加了请求数量以实现更好的缓存
	// 		// 它还可以用于减小文件大小，以加快重建速度。
	// 		minSize: 30000, //表示在压缩前的最小模块大小,默认值是30kb

	// 		minChunks: 1, // 表示被引用次数，默认为1；
	// 		maxAsyncRequests: 6, // 按需加载时的最大并行请求数
	// 		maxInitialRequests: 4, // 入口的最大并行请求数
	// 		automaticNameDelimiter: '~', // 名称分隔符，默认是~
	// 		name: true, // 打包后的名称，默认是 chunk 的名字通过分隔符（默认是～）分隔
	// 		cacheGroups: {
	// 			// 设置缓存组用来抽取满足不同规则的 chunk ,下面以生成 common 为例
	// 			common: {
	// 				name: 'common', // 抽取的 chunk 的名字
	// 				chunks: 'all',
	// 				chunks(chunk) {
	// 					// 同外层的参数配置，覆盖外层的 chunks ，以 chunk 为维度进行抽取
	// 				},
	// 				test(module, chunks) {
	// 					// 可以为字符串，正则表达式，函数，以 module 为维度进行抽取，只要是满足条件的 module 都会被抽取到该 common 的 chunk 中，为函数时第一个参数是遍历到的每一个模块，第二个参数是每一个引用到该模块的 chunks 数组。
	// 				},
	// 				priority: 10, // 优先级，一个 chunk 很可能满足多个缓存组，会被抽取到优先级高的缓存组中
	// 				minChunks: 2, // 最少被几个 chunk 引用
	// 				reuseExistingChunk: true, // 如果该 chunk 中引用了已经被抽取的 chunk，直接引用该 chunk，不会重复打包代码
	// 				enforce: true, // 如果 cacheGroup 中没有设置 minSize ，则据此判断是否使用上层的 minSize ，true：则使用0，false：使用上层 minSize
	// 			},
	// 		},
	// 	},
	// },
	plugins: plugins,
});

if (analyze) { // analyze 为 true，则开启 SpeedMeasurePlugin
	module.exports = smp.wrap(prodWebpackConfig)
} else {
	module.exports = prodWebpackConfig
}
