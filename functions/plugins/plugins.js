exports.handler = (ev, ctx, cb) => {
  cb(null, {
    status: 200,
    body: '[]',
    headers: {
      'Content-type': 'application/json'
    }
  })
}
