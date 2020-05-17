exports.handler = (ev, ctx, cb) => {
  const resp = {
    foo: 'bar'
  }
  cb(null, {
    status: 400,
    body: JSON.stringify(resp),
    headers: {
      'Content-type': 'application/json'
    }
  })
}