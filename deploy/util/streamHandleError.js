exports.getHandleErrorFn = (req, res) => err => {
  console.error('getHandleErrorFn', err)
  res.status(501).send(err.toString())
}