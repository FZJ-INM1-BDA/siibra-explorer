const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const path = require('path')

module.exports = {
  module : {
    rules : [
      {
        test : /\.ts$/,
        loaders : ['ts-loader','angular2-template-loader?keepUrl=true'],
        exclude : /node_modules/
      },
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
        test : /export_nehuba.*?.css$/,
        use : {
          loader : 'file-loader',
          options: {
            name : '[name].[ext]'
          }
        }
      },
      {
        type : 'javascript/auto',
        test : /ext.*?\.json/,
        use : [{
          loader : 'file-loader',
          options : {
            name : '[name].[ext]',
            outputPath : 'res/json'
          }
        }]
      }
    ]
  },
  plugins : [
    new webpack.ContextReplacementPlugin(/@angular(\\|\/)core(\\|\/)/,path.join(__dirname,'src')),
    new HtmlWebpackPlugin({
      template : 'src/index.html'
    })
  ],
  resolve : {
    extensions : [
      '.ts',
      '.js',
      '.json'
    ]
  },
}