const fs = require('fs')

exports.handler = (ev, ctx, cb) => {
  
  const {
    path,
    httpMethod,
    headers,
    queryStringParameters,
    body,
    isBase64Encoded,
  } = ev

  const templates = [
    // 'infant',
    'bigbrain',
    'colin',
    'MNI152',
    'waxholmRatV2_0',
    'allenMouse'
  ]

  const resp = templates

  const re = /templates\/(.+)$/.exec(path)

  if (re) {
    const templateName = re[1]
    fs.readFile(`./json/${templateName}.json`, 'utf-8', (err, data) => {
      if (err) {
        return cb(null, {
          status: 500,
          body: err.toString()
        })
      }
      return cb(null, {
        status: 200,
        body: data,
        headers: {
          'Content-type': 'application/json'
        }
      })
    })
  } else {
    cb(null, {
      status: 200,
      body: JSON.stringify(resp),
      headers: {
        'Content-type': 'application/json'
      }
    })
  }
}