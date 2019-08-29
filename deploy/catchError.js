module.exports = (raw, req, res, next) => {
  /**
   * probably use more elaborate logging?
   */
  const { code, error, trace } = raw
  console.error('Catching error', {
    code,
    error,
    trace,
    raw
  })
  res.status(code).send()
}