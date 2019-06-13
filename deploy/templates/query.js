const fs = require('fs')
const path = require('path')

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

exports.getTemplate = (template) => new Promise((resolve, reject) => {
  let filepath
  if (process.env.NODE_ENV === 'production') {
    filepath = path.join(__dirname, '..', 'res', `${template}.json`)
  } else {
    filepath = path.join(__dirname, '..', '..', 'src', 'res', 'ext', `${template}.json`)
  }
  fs.readFile(filepath, 'utf-8', (err, data) => {
    if (err) reject(err)
    resolve(data)
  })
})