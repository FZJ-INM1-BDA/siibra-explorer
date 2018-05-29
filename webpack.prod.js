const common = require('./webpack.common.js')
const merge = require('webpack-merge')
const Uglify = require('uglifyjs-webpack-plugin')
const path = require('path')
const ClosureCompilerPlugin = require('webpack-closure-compiler')

module.exports = merge(common,{
  mode : 'production',
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
    })
  ]
})