const request = require('request')
const qs = require('querystring')

class Logger {
  constructor(name, { protocol = 'http', host = 'localhost', port = '24224', username = '', password = '' } = {}){
    this.name = qs.escape(name)
    this.protocol = protocol
    this.host = host
    this.port = port
    this.username = username
    this.password = password
  }

  emit(logLevel, message, callback){
    const {
      name,
      protocol,
      host,
      port,
      username,
      password
    } = this
    
    const auth = username !== '' ? `${username}:${password}@` : ''
    const url = `${protocol}://${auth}${host}:${port}/${name}.${qs.escape(logLevel)}`
    const formData = {
      json: JSON.stringify(message)
    }
    if (callback) {
      request.post({
        url,
        formData
      }, callback)
    } else {
      return request.post({
        url,
        formData
      })
    }
  }
}

module.exports = Logger