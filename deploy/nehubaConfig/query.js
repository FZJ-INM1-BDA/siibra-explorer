const fs = require('fs')
const path = require('path')

exports.getTemplateNehubaConfig = (configId) => new Promise((resolve, reject) => {
  let filepath
  if (process.env.NODE_ENV === 'production') {
    filepath = path.join(__dirname, '..', 'res', `${configId}.json`)
  } else {
    filepath = path.join(__dirname, '..', '..', 'src', 'res', 'ext', `${configId}.json`)
  }
  fs.readFile(filepath, 'utf-8', (err, data) => {
    if (err) return reject(err)
    resolve(data)
  })
})