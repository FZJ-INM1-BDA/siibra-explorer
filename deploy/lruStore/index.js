/**
 * Cache to allow for in memory response while data fetching/processing occur
 */

const { 
  REDIS_PROTO,
  REDIS_ADDR,
  REDIS_PORT,

  REDIS_RATE_LIMITING_DB_EPHEMERAL_PORT_6379_TCP_PROTO,
  REDIS_RATE_LIMITING_DB_EPHEMERAL_PORT_6379_TCP_ADDR,
  REDIS_RATE_LIMITING_DB_EPHEMERAL_PORT_6379_TCP_PORT,

  REDIS_USERNAME,
  REDIS_PASSWORD,

} = process.env

const redisProto = REDIS_PROTO || REDIS_RATE_LIMITING_DB_EPHEMERAL_PORT_6379_TCP_PROTO || 'redis'
const redisAddr = REDIS_ADDR || REDIS_RATE_LIMITING_DB_EPHEMERAL_PORT_6379_TCP_ADDR || null
const redisPort = REDIS_PORT || REDIS_RATE_LIMITING_DB_EPHEMERAL_PORT_6379_TCP_PORT || 6379

const userPass = (() => {
  let returnString = ''
  if (REDIS_USERNAME) {
    returnString += REDIS_USERNAME
  }
  if (REDIS_PASSWORD) {
    returnString += `:${REDIS_PASSWORD}`
  }
  return returnString === ''
    ? ''
    : `${returnString}@`
})()

const _redisURL = redisAddr && `${redisProto || ''}://${userPass}${redisAddr}:${redisPort}`

const crypto = require('crypto')

let authKey

const getAuthKey = () => {
  crypto.randomBytes(128, (err, buf) => {
    if (err) {
      console.error(`generating random bytes error`, err)
      return
    }
    authKey = buf.toString('base64')
    console.log(`clear store key: ${authKey}`)
  })
}

getAuthKey()

const ensureString = val => {
  if (typeof val !== 'string') throw new Error(`both key and val must be string`)
}

class ExportObj {
  constructor(){
    this.StoreType = null
    this.redisURL = null
    this.store = null
    this._rs = null
    this._rj = null

    this._initPr = new Promise((rs, rj) => {
      this._rs = rs
      this._rj = rj
    })
  }
}

const exportObj = new ExportObj()

const setupLru = () => {

  const LRU = require('lru-cache')
  const lruStore = new LRU({
    max: 1024 * 1024 * 1024, // 1gb
    length: (n, key) => n.length,
    maxAge: Infinity, // never expires
  })

  exportObj.store = {
    /**
     * maxage in milli seconds
     */
    set: async (key, val, { maxAge } = {}) => {
      ensureString(key)
      ensureString(val)
      lruStore.set(key, val, ...( maxAge ? [ maxAge ] : [] ))
    },
    get: async (key) => {
      ensureString(key)
      return lruStore.get(key)
    },
    clear: async auth => {
      if (auth !== authKey) {
        getAuthKey()
        throw new Error(`unauthorized`)
      }
      lruStore.reset()
    }
  }

  exportObj.StoreType = `lru-cache`
  console.log(`using lru-cache`)
  exportObj._rs()
}

if (_redisURL) {
  const redis = require('redis')
  const { promisify } = require('util')
  const client = redis.createClient({
    url: _redisURL
  })

  client.on('ready', () => {

    const asyncGet = promisify(client.get).bind(client)
    const asyncSet = promisify(client.set).bind(client)
    const asyncDel = promisify(client.del).bind(client)
  
    const keys = []
  
    /**
     * maxage in milli seconds
     */
     exportObj.store = {
      set: async (key, val, { maxAge } = {}) => {
        ensureString(key)
        ensureString(val)
        asyncSet(key, val, ...( maxAge ? [ 'PX', maxAge ] : [] ))
        keys.push(key)
      },
      get: async (key) => {
        ensureString(key)
        return asyncGet(key)
      },
      clear: async auth => {
        if (auth !== authKey) {
          getAuthKey()
          throw new Error(`unauthorized`)
        }
        await asyncDel(keys.splice(0))
      }
    }
  
    exportObj.StoreType = `redis`
    exportObj.redisURL = _redisURL
    console.log(`using redis`)
    exportObj._rs()
  }).on('error', () => {
    console.warn(`setting up Redis error, fallback to setupLru`)
    setupLru()
    client.quit()
  })

} else {
  setupLru()
}

module.exports = exportObj