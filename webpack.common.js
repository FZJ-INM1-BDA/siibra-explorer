const webpack = require('webpack')
const path = require('path')

module.exports = {
  module : {
    rules : [
      {
        test : /\.ts$/,
        loaders : ['ts-loader','angular2-template-loader?keepUrl=true'],
        exclude : /node_modules|[Ss]pec\.ts$/
      },
      {
        test : /export_nehuba|.*?worker.*?\.js$/,
        use : {
          loader : 'file-loader',
          options: {
            name : '[name].[ext]'
          }
        }
      }
    ]
  },
  plugins : [
    new webpack.ContextReplacementPlugin(/@angular(\\|\/)core(\\|\/)/,path.join(__dirname,'src'))
  ],
  resolve : {
    extensions : [
      '.ts',
      '.js',
      '.json'
    ],
    alias : {
      "third_party" : path.resolve(__dirname,'third_party'),
      "src" : path.resolve(__dirname,'src')
    }
  },
}