const common = require('./webpack.common.js')
const path = require('path')
const ngtools = require('@ngtools/webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const AngularCompilerPlugin = ngtools.AngularCompilerPlugin
const ClosureCompilerPlugin = require('webpack-closure-compiler')
const merge = require('webpack-merge')
const staticAssets = require('./webpack.staticassets')

module.exports = merge(staticAssets, {

  entry : './src/main-aot.ts',
  output : {
    filename : 'main.js',
    path : path.resolve(__dirname,'dist/aot')
  },
  module: {
    rules: [
      {
        test : /export_nehuba.*?worker.*?\.js$/,
        use : {
          loader : 'file-loader',
          options: {
            name : '[name].[ext]'
          }
        }
      },
      {
        test: /(?:\.ngfactory\.js|\.ngstyle\.js|\.ts)$/,
        // test : /\.ts$/,
        loader: '@ngtools/webpack',
        exclude : /export_nehuba/
      },
      {
        test : /\.(html|css)$/,
        exclude : /export\_nehuba|index|res\/css/,
        use : {
          loader : 'raw-loader',
        }
      },
      {
        test : /res\/css.*?css$/,
        use : {
          loader : 'file-loader',
          options : {
            name : '[name].[ext]'
          }
        }
      }
    ]
  },
  plugins : [
    new HtmlWebpackPlugin({
      template : 'src/index.html'
    }),
    new AngularCompilerPlugin({
      tsConfigPath: 'tsconfig-aot.json',
      entryModule: 'src/main.module#MainModule'
    })
  ],
  resolve : {
    extensions : [
      '.ts',
      '.js',
      '.json'
    ],
    alias : {
      "third_party" : path.resolve(__dirname,'third_party')
    }
  }
})