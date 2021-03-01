const fs = require('fs')
const path = require('path')

const PUBLIC_PATH = process.env.NODE_ENV === 'production'
  ? path.join(__dirname, 'public')
  : path.join(__dirname, '..', 'dist', 'aot')

let indexTemplate
try {

  indexTemplate = fs.readFileSync(
    path.join(PUBLIC_PATH, 'index.html'),
    'utf-8'
  )
  
} catch (e) {
  console.error(`index.html cannot be read. maybe run 'npm run build-aot' at root dir first?`)
}
module.exports = {
  indexTemplate
}
