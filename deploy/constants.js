const fs = require('fs')

const PUBLIC_PATH = process.env.NODE_ENV === 'production'
  ? path.join(__dirname, 'public')
  : path.join(__dirname, '..', 'dist', 'aot')

const indexTemplate = fs.readFileSync(
  path.join(PUBLIC_PATH, 'index.html'),
  'utf-8'
)

module.exports = {
  indexTemplate
}
