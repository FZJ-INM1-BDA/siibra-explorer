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

const app = require('./app')
const PORT = process.env.PORT || 3000

// e.g. HOST_PATHNAME=/viewer
// n.b. leading slash is important
const HOST_PATHNAME = process.env.HOST_PATHNAME || ''

server.disable('x-powered-by')

server.use(HOST_PATHNAME, app)
server.listen(PORT, () => console.log(`listening on port ${PORT}`))