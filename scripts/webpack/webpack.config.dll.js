/**
 * 打包Dll的Webpack配置文件
 * 注意：本项目使用的是 HardSourceWebpackPlugin，所以这个弃用
 */
const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
// 抽离 css
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const webpack = require('webpack');

// dll 配置文件（在下面）
const config = require('../../config');

// 这里把 styleLoaders 配置也单独独立出去了
const utils = require('../tools/utils');
const generateDllMap = require('../tools/generateDllMap')

const dlls = config.dlls;
// dll 版本号
const dllVersion = dlls.version; 
// dll 默认配置（你也可以配置可控）
const dllConfig = dlls.dllPlugin.defaults;
// dll 入口文件
const dllEntry = dlls.dllPlugin.entry;
// dll 包出口路径
const outputPath = path.resolve(dllConfig.buildPath);
// dll 生成映射表json文件地址
const outputPathMap = path.resolve(dllConfig.buildPath, '[name].json');

const isDev = process.env.NODE_ENV === 'development';

const plugins = [
  // 接入 DllPlugin
  new webpack.DllPlugin({
    // 动态链接库的全局变量名称，需要和 output.library 中保持一致
    // 该字段的值也就是输出的 json 文件 中 name 字段的值
    name: '[name]', // json文件名
    // 描述动态链接库的 json 文件输出时的文件名称
    path: outputPathMap //生成映射表json文件地址
  }),
  // 清除原有打包文件
  new CleanWebpackPlugin({
    root: process.cwd(), // 根目录
    verbose: true, // 开启在控制台输出信息
    dry: false // 启用删除文件
  }),
]

if (isDev) {
  // 将webpack生成的映射表中的数字id，替换为路径id  1---->./nodu_module/react/dist/react.js
  plugins.push(new webpack.NamedModulesPlugin());
} else {
  // 抽离 css
  plugins.push(new MiniCssExtractPlugin({
	filename: `[name]_${dllVersion}` + '.dll.css',
	chunkFilename: `[id]_${dllVersion}` + '.dll.css',
	disable: false, //是否禁用此插件
	allChunks: true,
  }));
}

// module.exports
module.exports = {
  // 上下文
  context: process.cwd(),
  // 执行入口文件
  entry: dllEntry(),
  // 调试模式
  devtool: isDev ? 'eval' : false,
  // 打包文件输出
  output: {
    // 输出的动态链接库的文件名称，[name]_${dllVersion} 代表当前动态链接库的名称，
    filename: `[name]_${dllVersion}.dll.js`,
    // 输出的文件都放到 outputPath 目录下
    path: outputPath,
    // 存放动态链接库的全局变量名称
    library: '[name]',
  },
  // loaders
  module: {
    rules: utils.styleLoaders({
      extract: !isDev
    })
  },
  // webpack插件
  plugins: plugins,
  // 性能提示
  performance: {
    hints: false,
  },
}

// 打包完，生成 dllAliasMap.json
process.on('exit', (err) => {
  generateDllMap(outputPath, err);
});