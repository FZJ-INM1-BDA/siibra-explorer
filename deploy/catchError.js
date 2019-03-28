module.exports = ({code = 500, error = 'an error had occured'}, req, res, next) => {
  /**
   * probably use more elaborate logging?
   */
  console.log('Catching error', JSON.stringify(error))
  res.sendStatus(code)
}