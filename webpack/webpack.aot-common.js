const webpack = require('webpack')
const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const ngtools = require('@ngtools/webpack')
const AngularCompilerPlugin = ngtools.AngularCompilerPlugin
const merge = require('webpack-merge')
const staticAssets = require('./webpack.staticassets')

const commonAot = {
  entry: {
    main: './src/main-aot.ts'
  },
  output : {
    filename : '[name].js',
    path : path.resolve(__dirname,'../dist/aot')
  },
  module: {
    rules: [
      {
        test : /third_party.*?\.js$|worker\.js|worker-\w+\.js/,
        use : {
          loader : 'file-loader',
          options: {
            name : '[name].[ext]'
          }
        }
      },
      {
        test: /(?:\.ngfactory\.js|\.ngstyle\.js|\.ts)$/,
        loader: '@ngtools/webpack',
        exclude : /third_party|plugin_example|spec\.ts|test\.ts/
      },
      {
        test : /\.(html|css)$/,
        exclude : /export\_nehuba|index|res\/css|plugin_example|material\/prebuilt-themes/,
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
      entryModule: 'src/main.module#MainModule',
      directTemplateLoading: true
    }),
    new webpack.DefinePlugin({
      // TODO have to figure out how to set this properly
      // needed to avoid inline eval
      // shouldn't mode: 'production' do that already?
      ngDevMode: false,
      ngJitMode: false
    })
  ],
  resolve : {
    extensions : [
      '.ts',
      '.js',
      '.json'
    ],
    alias : {
      "third_party" : path.resolve(__dirname, '../third_party'),
      "src" : path.resolve(__dirname, '../src')
    }
  }
}

module.exports = merge(staticAssets, commonAot)