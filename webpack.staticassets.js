const webpack = require('webpack')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

module.exports = {
  module : {
    rules : [
      {
        test: /\.scss$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader
          },
          'css-loader',
          'sass-loader'
        ]
      },
      {
        test : /\.jpg$|\.png$|\.svg$/,
        exclude : /export\_nehuba|index/,
        use : {
          loader : 'file-loader',
          options : {
            name : 'res/image/[name].[ext]'
          }
        }
      },
      {
        type : 'javascript/auto',
        test : /ext.*?\.json/,
        exclude : /plugin_examples/,
        use : [{
          loader : 'file-loader',
          options : {
            name : '[name].[ext]',
            outputPath : 'res/json'
          }
        }]
      },
      {
        type : 'javascript/auto',
        test : /plugin_examples/,
        use : [{
          loader : 'file-loader',
          options : {
            name : '[path][name].[ext]',
            outputPath : 'res',
            context : 'src'
          }
        }]
      }
    ]
  },
  plugins : [
    new MiniCssExtractPlugin({
      filename: 'theme.css'
    }),
    new webpack.DefinePlugin({
      PLUGINDEV : process.env.PLUGINDEV
        ? JSON.stringify(process.env.PLUGINDEV)
        : false,
      BUNDLEDPLUGINS : process.env.BUNDLEDPLUGINS
        ? JSON.stringify(process.env.BUNDLEDPLUGINS.split(','))
        : JSON.stringify([]),
      VERSION : process.env.VERSION 
        ? JSON.stringify(process.env.VERSION) 
        : process.env.GIT_HASH
          ? JSON.stringify(process.env.GIT_HASH)
          : JSON.stringify('unspecificied hash'),
      PRODUCTION: process.env.PRODUCTION
        ? true
        : false,
      BACKEND_URL: (process.env.BACKEND_URL && JSON.stringify(process.env.BACKEND_URL)) || 'null',
      USE_LOGO: JSON.stringify(process.env.USE_LOGO || 'hbp' || 'ebrains' ),
      DATASET_PREVIEW_URL: JSON.stringify(process.env.DATASET_PREVIEW_URL || 'https://hbp-kg-dataset-previewer.apps.hbp.eu/datasetPreview'),
      MATAMO_URL: JSON.stringify(process.env.MATAMO_URL || null),
      MATAMO_ID: JSON.stringify(process.env.MATAMO_ID || null)
    })
  ],
  resolve: {
    extensions: [
      '.scss'
    ]
  }
}