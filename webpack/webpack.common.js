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
    ]
  },
  plugins : [
    new webpack.ContextReplacementPlugin(/@angular(\\|\/)core(\\|\/)/,path.join(__dirname, '../src'))
  ],
  resolve : {
    extensions : [
      '.ts',
      '.js',
      '.json'
    ],
    alias : {
      "third_party" : path.resolve(__dirname, '../third_party'),
      "src" : path.resolve(__dirname, '../src'),
      "common": path.resolve(__dirname, '../common'),
      "spec": path.resolve(__dirname, '../spec')
    }
  },
}