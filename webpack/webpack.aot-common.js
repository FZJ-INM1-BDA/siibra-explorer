const webpack = require('webpack')
const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const ngtools = require('@ngtools/webpack')
const AngularCompilerPlugin = ngtools.AngularCompilerPlugin
const merge = require('webpack-merge')
const staticAssets = require('./webpack.staticassets')

const compileQuickOnePager = async () => {

  const TITLE = 'Interactive Atlas Viewer Quickstart'

  const showdown = require('showdown')
  
  const fs = require('fs')
  const { promisify } = require('util')
  const asyncReadfile = promisify(fs.readFile)
  
  const mdConverter = new showdown.Converter({
    tables: true
  })
  
  const pathToMd = path.join(__dirname, '../common/helpOnePager.md')
  const mdData = await asyncReadfile(pathToMd, 'utf-8')
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T" crossorigin="anonymous">
  <script src="https://unpkg.com/dompurify@latest/dist/purify.min.js"></script>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${TITLE}</title>
</head>
<body class="p-4">
  
</body>
<script>
(() => {
  const dirty = \`${mdConverter.makeHtml(mdData).replace(/\`/g, '\\`')}\`
  const clean = DOMPurify.sanitize(dirty)
  document.body.innerHTML = clean
})()
</script>
</html>
`
}
const outputPath = path.resolve(__dirname,'../dist/aot')

compileQuickOnePager()
  .then(html => {
    const fs = require('fs')
    fs.writeFile(path.join(outputPath, 'quickstart.html'), html, 'utf-8', (err) => {
      if (err) throw new Error(`quickOnePager cannot be written to disk`)
    })
  })
  .catch(e => {
    console.warn(e)
  })

const commonAot = {
  entry: {
    main: './src/main-aot.ts'
  },
  output : {
    filename : '[name].js',
    path : outputPath
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