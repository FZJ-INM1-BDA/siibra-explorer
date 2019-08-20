const BROTLI = `br`
const GZIP = `gzip`

const detEncoding = (acceptEncoding) => /br/i.test(acceptEncoding)
  ? BROTLI
  : /gzip/i.test(acceptEncoding)
    ? GZP
    : null

const mimeMap = new Map([
  ['.png', 'image/png'],
  ['.gif', 'image/gif'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.css', 'text/css'],
  ['.html', 'text/html'],
  ['.js', 'text/javascript']
])

module.exports = (req, res, next) => {
  const acceptEncoding = req.get('Accept-Encoding')
  const encoding = detEncoding(acceptEncoding)
  
  const ext = /(\.\w*?)$/.exec(req.url)

  if (!ext || !mimeMap.get(ext[1])) return next()
  
  if (encoding === BROTLI) {
    req.url = req.url + '.br'
    res.set('Content-Encoding', encoding)
    res.set('Content-Type', mimeMap.get(ext[1]))
    return next()
  }

  if (encoding === GZIP) {
    req.url = req.url + '.gz'
    res.set('Content-Encoding', encoding)
    res.set('Content-Type', mimeMap.get(ext[1]))
    return next()
  }

  next()
}