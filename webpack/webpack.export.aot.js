const common = require('./webpack.common.js')
const path = require('path')
const ngtools = require('@ngtools/webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const AngularCompilerPlugin = ngtools.AngularCompilerPlugin
const ClosureCompilerPlugin = require('webpack-closure-compiler')

module.exports = {

  entry : './src/main-aot.ts',
  output : {
    filename : 'main.js',
    path : path.resolve(__dirname,'../dist/export-aot')
  },
  module: {
    rules: [
      {
        test: /(?:\.ngfactory\.js|\.ngstyle\.js|\.ts)$/,
        // test : /\.ts$/,
        loader: '@ngtools/webpack',
        exclude : /third_party/
      },
      {
        test : /\.(html|css)$/,
        use : {
          loader : 'raw-loader',
        }
      }
    ]
  },
  plugins : [
    new HtmlWebpackPlugin({
      template : './src/atlasViewerExports/export.html'
    }),
    new AngularCompilerPlugin({
      tsConfigPath: 'tsconfig-aot.json',
      entryModule: 'src/atlasViewerExports/export.module#ExportModule'
    })
  ],
  resolve : {
    extensions : [
      '.ts',
      '.js',
      '.json'
    ]
  }
}