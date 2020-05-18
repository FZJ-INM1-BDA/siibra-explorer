const CACHED_DATASET_URL = process.env.CACHED_DATASET_URL
exports.handler = (ev, ctx, cb) => {
  const {
    path,
    httpMethod,
    headers,
    queryStringParameters,
    body,
    isBase64Encoded,
  } = ev


  const re = /datasets\/\/?templateNameParcellationName\/(.+)\/(.*?)$/.exec(path)
  if (!re) {
    return cb(null, { status: 401 })
  }
  
  const [ _, templateName, parcellationName ] = re
  if (CACHED_DATASET_URL) {
    cb(null, {
      statusCode: 302,
      headers: {
        'Location': CACHED_DATASET_URL
      }
    })
  } else {
    return cb(null, {
      statusCode: 200,
      body: '[]',
      headers: {
        'content-type': 'application/json'
      }
    })
  }
}
