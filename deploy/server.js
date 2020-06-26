if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
  process.on('unhandledRejection', (err, p) => {
    console.log({err, p})
  })
}

if (process.env.FLUENT_HOST) {
  const Logger = require('./logging')

  const name = process.env.IAV_NAME || 'IAV'
  const stage = process.env.IAV_STAGE || 'unnamed-stage'

  const protocol = process.env.FLUENT_PROTOCOL || 'http'
  const host = process.env.FLUENT_HOST || 'localhost'
  const port = process.env.FLUENT_PORT || 24224
  
  const prefix = `${name}.${stage}`

  const log = new Logger(prefix, {
    protocol,
    host,
    port
  })

  const handleRequestCallback = (err, resp, body) => {
    if (err) {
      process.stderr.write(`fluentD logging failed\n`)
      process.stderr.write(err.toString())
      process.stderr.write('\n')
    }

    if (resp && resp.statusCode >= 400) {
      process.stderr.write(`fluentD logging responded error\n`)
      process.stderr.write(resp.toString())
      process.stderr.write('\n')
    }
  }

  const emitInfo = message => log.emit('info', { message }, handleRequestCallback)

  const emitWarn = message => log.emit('warn', { message }, handleRequestCallback)

  const emitError = message => log.emit('error', { message }, handleRequestCallback)

  console.log('starting fluentd logging')

  console.log = function () {
    emitInfo([...arguments])
  }
  console.warn = function () {
    emitWarn([...arguments])
  }
  console.error = function () {
    emitError([...arguments])
  }
}

const server = require('express')()

const PORT = process.env.PORT || 3000

// e.g. HOST_PATHNAME=/viewer
// n.b. leading slash is important
// n.b. no trailing slash is important
const HOST_PATHNAME = process.env.HOST_PATHNAME || ''

if(HOST_PATHNAME !== '') {
  if (HOST_PATHNAME.slice(0,1) !== '/') throw new Error(`HOST_PATHNAME, if defined and non-empty, should start with a leading slash. HOST_PATHNAME: ${HOST_PATHNAME}`)
  if (HOST_PATHNAME.slice(-1) === '/') throw new Error(`HOST_PATHNAME, if defined and non-emtpy, should NOT end with a slash. HOST_PATHNAME: ${HOST_PATHNAME}`)
}

server.set('strict routing', true)
server.set('trust proxy', 1)

server.disable('x-powered-by')

if (HOST_PATHNAME && HOST_PATHNAME !== '') {
  server.get(HOST_PATHNAME, (_req, res) => {
    res.redirect(`${HOST_PATHNAME}/`)
  })
}

if (process.env.NODE_ENV !== 'test') {
  const app = require('./app')
  server.use(`${HOST_PATHNAME}/`, app)
}

server.listen(PORT, () => console.log(`listening on port ${PORT}`))
