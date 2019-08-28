const fs = require('fs')
const path = require('path')
const { BROTLI, GZIP } = require('../compression')

exports.getAllTemplates = () => new Promise((resolve, reject) => {
  
  /**
   * TODO temporary. Need to query KG or something else for this data in the future
   */
  const templates = [
    // 'infant',
    'bigbrain',
    'colin',
    'MNI152',
    'waxholmRatV2_0',
    'allenMouse'
  ]
  resolve(templates)
})

const getFileAsPromise = filepath => new Promise((resolve, reject) => {
  fs.readFile(filepath, 'utf-8', (err, data) => {
    if (err) return reject(err)
    resolve(data)
  })
})

exports.getTemplate = ({ template, acceptedEncoding, returnAsStream }) => {

  let filepath
  if (process.env.NODE_ENV === 'production') {
    filepath = path.join(__dirname, '..', 'res', `${template}.json`)
  } else {
    filepath = path.join(__dirname, '..', '..', 'src', 'res', 'ext', `${template}.json`)
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