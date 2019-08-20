module.exports = ({code = 500, error = 'an error had occured', trace = 'undefined trace'}, req, res, next) => {
  /**
   * probably use more elaborate logging?
   */
  console.error('Catching error', {
    code,
    error,
    trace
  })
  res.status(code).send()
}