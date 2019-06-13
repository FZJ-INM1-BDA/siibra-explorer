const common = require('./webpack.common.js')
const merge = require('webpack-merge')
const path = require('path')
const ngAssets = require('./webpack.ngassets')
const staticAssets = require('./webpack.staticassets')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = merge(common,ngAssets,staticAssets,{
  entry : {
    main : './src/main.ts',
    styles: './src/styles.css'
  },
  mode : 'development',
  output : {
    filename : '[name].js',
    path : path.resolve(__dirname,'dist/dev')
  },
  devtool:'source-map',
  plugins : [
    new HtmlWebpackPlugin({
      template : 'src/index.html'
    })
  ]
})