module.exports = () =>{
  const urlState = require('./urlState')
  return (req, res, next) => {
    const query = req.query || {}
    const redir = urlState(query)
    if (redir) return res.redirect(redir)
    next()
  }
}
