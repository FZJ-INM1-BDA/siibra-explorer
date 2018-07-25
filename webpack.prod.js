const common = require('./webpack.common.js')
const merge = require('webpack-merge')
const Uglify = require('uglifyjs-webpack-plugin')
const path = require('path')
const ClosureCompilerPlugin = require('webpack-closure-compiler')
const ngAssets = require('./webpack.ngassets')
const staticAssets = require('./webpack.staticassets')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = merge(common,ngAssets,staticAssets,{
  entry : './src/main.ts',
  output : {
    filename : 'main.js',
    path : path.resolve(__dirname,'dist/prod')
  },
  plugins : [
    new ClosureCompilerPlugin({
      compiler : {
        compilation_level : 'SIMPLE'
      },
      concurrency : 4
    }),

    new HtmlWebpackPlugin({
      template : 'src/index.html'
    })
  ]
})