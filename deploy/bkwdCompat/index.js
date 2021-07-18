module.exports = () =>{
  const urlState = require('./urlState')
  return (req, res, next) => {
    const query = req.query || {}

    let errorMessage = ``
    const redir = urlState(query, err => {
      errorMessage += err
    })
    if (errorMessage !== '') {
      res.cookie(
        `iav-error`,
        errorMessage,
        {
          httpOnly: true,
          sameSite: 'strict',
          maxAge: 1e3 * 30
        }
      )
    }
    if (redir) return res.redirect(redir)
    next()
  }
}
