const merge = require('webpack-merge')
const aotCommon = require('./webpack.aot-common')
const path = require('path')
const inputOutput = require('./webpack.entry-output')

module.exports = merge(inputOutput, aotCommon, {
  mode: 'development',
  devtool:'source-map',
  devServer: {
    contentBase: path.join(__dirname, '../dist/aot/')
  }
})
