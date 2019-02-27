module.exports = ({code = 500, error = 'an error had occured'}, req, res, next) => {
  /**
   * probably use more elaborate logging?
   */
  res.status(code).send(error)
}