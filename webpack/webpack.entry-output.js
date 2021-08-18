const path = require('path')

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
    const { execSync } = require('child_process')
    const { promisify } = require('util')
    const asyncWrite = promisify(fs.writeFile)
    execSync(`mkdir -p ${outputPath}`)
    return asyncWrite(path.join(outputPath, 'quickstart.html'), html, 'utf-8')
  })
  .catch(e => {
    console.warn(e)
  })

const { AngularWebpackPlugin } = require('@ngtools/webpack')

module.exports = {
  entry: {
    main: './src/main-aot.ts'
  },
  output : {
    filename : '[name].js',
    path : outputPath
  },
  plugins: [
    new AngularWebpackPlugin({
      tsConfigPath: 'tsconfig.app.json',
      // entryModule: 'src/main.module#MainModule',
      directTemplateLoading: true
    }),
  ]
}