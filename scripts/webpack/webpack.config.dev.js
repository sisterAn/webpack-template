const webpack = require('webpack')
const merge = require('webpack-merge');
const common = require('./webpack.config.com.js');
const utils = require('../tools/utils')
module.exports = merge(common, {
	mode: 'development',
	devtool: 'cheap-module-eval-source-map',
	devServer: {
		contentBase: '/',
		hot: true,
		port: 8001,
	},
	module:{ // 不抽离 css
		rules: utils.styleLoaders({
      sourceMap: false,
      extract: false,
      publicPath: '../'
    })
	},
	plugins: [
		//webpack编译过程中设置全局变量process.env
		new webpack.DefinePlugin({
			'process.env': { 
				NODE_ENV: '"development"' 
			},
		}),
	]
});
