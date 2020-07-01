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
            name (resourcePath, resourceQuery) {
              const appendAtlas = /res\/ext\/atlas\//.test(resourcePath)
              return `${appendAtlas ? 'atlas/' : ''}[name].[ext]`
            },
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

      VERSION: process.env.VERSION 
        ? JSON.stringify(process.env.VERSION) 
        : process.env.GIT_HASH
          ? JSON.stringify(process.env.GIT_HASH)
          : JSON.stringify('unspecificied hash'),
      PRODUCTION: !!process.env.PRODUCTION,
      BACKEND_URL: (process.env.BACKEND_URL && JSON.stringify(process.env.BACKEND_URL)) || 'null',
      DATASET_PREVIEW_URL: JSON.stringify(process.env.DATASET_PREVIEW_URL || 'https://hbp-kg-dataset-previewer.apps.hbp.eu/datasetPreview'),
      SPATIAL_TRANSFORM_BACKEND: JSON.stringify(process.env.SPATIAL_TRANSFORM_BACKEND || 'https://hbp-spatial-backend.apps.hbp.eu'),
      MATOMO_URL: JSON.stringify(process.env.MATOMO_URL || null),
      MATOMO_ID: JSON.stringify(process.env.MATOMO_ID || null),

      // strick local hides "explore" and "download" btns, which requires internet
      STRICT_LOCAL: process.env.STRICT_LOCAL === 'true' ? 'true' : 'false',

      // invite user to touch/interact after 5 min of inactivity
      KIOSK_MODE: process.env.KIOSK_MODE === 'true' ? 'true' : 'false',
    })
  ],
  resolve: {
    extensions: [
      '.scss'
    ]
  }
}