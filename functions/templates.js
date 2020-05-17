exports.handler = (ev, ctx, cb) => {
  const resp = {
    hello: 'world'
  }
  cb(null, {
    status: 400,
    body: JSON.stringify(resp),
    headers: {
      'Content-type': 'application/json'
    }
  })
}