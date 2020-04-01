// because includeMatomo.js is included via file loader
// webpack define plugin was not able to transform the variables
// hence, this script needs to be run post build-aot to transform the included includeMatomo.js

(() => {

  if (!process.env.MATOMO_URL) return
  if (!process.env.MATOMO_ID) return
  
  const fs = require('fs')
  const path = require('path')
  
  const currPathMamotoJs = path.join(__dirname, './includeMatomo.js')
  const pathToMatomoJs = path.join(__dirname, '../../dist/aot/includeMatomo.js')
  const matomoJs = fs.readFileSync(
    currPathMamotoJs,
    'utf-8'
  )
  
  const processed = matomoJs
    .replace(/MATOMO_URL/g, JSON.stringify(process.env.MATOMO_URL || null))
    .replace(/MATOMO_ID/g, process.env.MATOMO_ID || 'null')
  
  fs.writeFileSync(
    pathToMatomoJs,
    processed,
    'utf-8'
  )
  
  const pathToIndexHtml = path.join(
    __dirname,
    '../../dist/aot/index.html'
  )
  
  const indexHtml = fs.readFileSync(
    pathToIndexHtml,
    'utf-8'
  )
  
  const processedIndexHtml = indexHtml
    .replace('</head>', s => `<script src="includeMatomo.js"></script>${s}`)
  
  fs.writeFileSync(
    pathToIndexHtml,
    processedIndexHtml,
    'utf-8'
  )
})()
