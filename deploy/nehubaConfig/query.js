const fs = require('fs')
const path = require('path')
const { BROTLI, GZIP } = require('../compression')

const getFileAsPromise = filepath => new Promise((resolve, reject) => {
  fs.readFile(filepath, 'utf-8', (err, data) => {
    if (err) return reject(err)
    resolve(data)
  })
})

exports.getTemplateNehubaConfig = ({configId, acceptedEncoding, returnAsStream}) => {
  if (process.env.NODE_ENV === 'production') {
    filepath = path.join(__dirname, '..', 'res', `${configId}.json`)
  } else {
    filepath = path.join(__dirname, '..', '..', 'src', 'res', 'ext', `${configId}.json`)
  }

  if (acceptedEncoding === BROTLI) {
    if (returnAsStream) return fs.createReadStream(`${filepath}.br`)
    else return getFileAsPromise(`${filepath}.br`)
  }

  if (acceptedEncoding === GZIP) {
    if (returnAsStream) return fs.createReadStream(`${filepath}.gz`)
    else return getFileAsPromise(`${filepath}.gz`)
  }

  if (returnAsStream) return fs.createReadStream(filepath)
  else return getFileAsPromise(filepath)
} 