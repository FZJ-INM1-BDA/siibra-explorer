const merge = require('webpack-merge')
const aotCommon = require('./webpack.aot-common')

module.exports = merge(aotCommon, {
  mode: 'development',
  devtool:'source-map',
})
