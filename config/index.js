const path = require('path');
const pullAll = require('lodash/pullAll'); // 数组除值
const uniq = require('lodash/uniq'); // 数组去重
const pm2Config = require('./pm2.config')


const reactDll = {
  version: '1.0.0',
  dllPlugin: {
    defaults: {
      exclude: [

      ],
      include: [
        'react',
        'react-dom',
      ],
      // 针对开发本地调试用devPath，针对各种环境打包时用buildPath
      devPath: 'common/@react_dll/dev_dll',
      buildPath: process.env.NODE_ENV === 'development' ? 'common/@react_dll/dev_dll' : 'common/@react_dll/prd_dll',
    },

    entry() {
      let dependencyNames = [];
      const exclude = reactDll.dllPlugin.defaults.exclude;
      const include = reactDll.dllPlugin.defaults.include;
      const includeDependencies = uniq([...include, ...dependencyNames]);
      return {
        reactDll: pullAll(includeDependencies, exclude),
      };
    },
  },
};

module.exports = {
  dlls: reactDll,
  pm2: {
    apps: [pm2Config]
  }
}
