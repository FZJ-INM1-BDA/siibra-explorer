const CACHED_DATASET_URL = process.env.CACHED_DATASET_URL
const got = require('got')
exports.handler = (ev, ctx, cb) => {
  const {
    path,
    httpMethod,
    headers,
    queryStringParameters,
    body,
    isBase64Encoded,
  } = ev


  const re = /datasets\/templateNameParcellationName\/\/?(.+)\/(.*?)$/.exec(path)
  if (!re) {
    return cb(null, { status: 401 })
  }
  
  const [ _, templateName, parcellationName ] = re
  if (CACHED_DATASET_URL) {
    got(CACHED_DATASET_URL)
      .then(text => cb(null, {
        status: 200,
        body: text,
        headers: {
          'content-type': 'application/json'
        }
      }))
  } else {
    return cb(null, {
      status: 200,
      body: '[]',
      headers: {
        'content-type': 'application/json'
      }
    })
  }
}
