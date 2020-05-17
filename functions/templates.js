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

  const resp = {
    templates,
    ev
  }
  
  cb(null, {
    status: 400,
    body: JSON.stringify(resp),
    headers: {
      'Content-type': 'application/json'
    }
  })
}