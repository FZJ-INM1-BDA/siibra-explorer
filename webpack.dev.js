const common = require('./webpack.common.js')
const merge = require('webpack-merge')
const path = require('path')
const ngAssets = require('./webpack.ngassets')

module.exports = merge(common,ngAssets,{
  entry : './src/main.ts',
  mode : 'development',
  output : {
    filename : 'main.js',
    path : path.resolve(__dirname,'dist/dev')
  },
  devtool:'source-map'
})