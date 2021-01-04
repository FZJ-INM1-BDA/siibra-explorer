const merge = require('webpack-merge')
const common = require('./webpack.common.js')
const ngAssets = require('./webpack.ngassets')
const path = require('path')
const ClosureCompilerPlugin = require('webpack-closure-compiler')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = merge(common,ngAssets,{
  entry : './src/atlasViewerExports/main.export.ts',
  mode : 'development',
  output : {
    filename : 'export.js',
    path : path.resolve(__dirname,'../dist/export')
  },
  devtool:'source-map',
  plugins : [
    // new ClosureCompilerPlugin({
    //   compiler : {
    //     compilation_level : 'SIMPLE'
    //   },
    //   concurrency : 4
    // }),

    new HtmlWebpackPlugin({
      template : './src/atlasViewerExports/export.html'
    })
  ]
})