const utils = require('../scripts/tools/utils')
const project = utils.argv.project
const site = utils.argv.site
//pm2的配置参数
module.exports = {
  name: `${site}_${project}`,
  script: 'main.js',
  cwd: `${process.cwd()}/dist/${site}/${project}/server`,
  instances: '2',
  exec_mode: 'cluster',
  max_memory_restart: '1G',
  'autorestart': true,
  'out_file': '../log/server.log',
  'error_file': '../log/error.log',
  'merge_logs': true,
  'env_testing': {
    'PORT': 2334,
    'NODE_ENV': 'testing'
  },
  'env_production': {
    'PORT': 2334,
    'NODE_ENV': 'production'
  }
}
