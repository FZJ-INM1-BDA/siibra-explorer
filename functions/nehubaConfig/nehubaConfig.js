const fs = require('fs')
const { reconfigureUrl } = require('./reconfigPrecomputedServer')
exports.handler = (ev, ctx, cb) => {
  const {
    path,
    httpMethod,
    headers,
    queryStringParameters,
    body,
    isBase64Encoded,
  } = ev


  const re = /nehubaConfig\/(.+)$/.exec(path)
  if (!re) {
    return cb(null, {
      status: 401,
      body: `config name is required`
    })
  }

  const configName = re[1]
  fs.readFile(`./json/${configName}.json`, 'utf-8', (err, data) => {
    if (err) {
      return cb(null, {
        status: 404,
        body: `config ${configName} does not exist, ${err.toString()}`
      })
    }
    return cb(null, {
      status: 200,
      body: reconfigureUrl(data),
      headers: {
        'Content-type': 'application/json'
      }
    })
  })
}