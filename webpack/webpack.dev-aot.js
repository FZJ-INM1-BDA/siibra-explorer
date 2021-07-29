const merge = require('webpack-merge')
const aotCommon = require('./webpack.aot-common')
const path = require('path')

module.exports = merge(aotCommon, {
  mode: 'development',
  devtool:'source-map',
  devServer: {
    contentBase: path.join(__dirname, '../dist/aot/')
  }
})
