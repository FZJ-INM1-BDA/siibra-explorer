const redis = require('redis')
const { promisify } = require('util')
const { getClient } = require('../auth/hbp-oidc-v2')
const { jwtDecode } = require('../auth/oidc')
const request = require('request')

const HBP_OIDC_V2_REFRESH_TOKEN_KEY = `HBP_OIDC_V2_REFRESH_TOKEN_KEY` // only insert valid refresh token. needs to be monitored to ensure always get new refresh token(s)
const HBP_OIDC_V2_ACCESS_TOKEN_KEY = `HBP_OIDC_V2_ACCESS_TOKEN_KEY` // only insert valid access token. if expired, get new one via refresh token, then pop & push
const HBP_OIDC_V2_UPDATE_CHAN = `HBP_OIDC_V2_UPDATE_CHAN` // stringified JSON key val of above three, with time stamp
const HBP_OIDC_V2_UPDATE_KEY = `HBP_OIDC_V2_UPDATE_KEY`
const HBP_DATAPROXY_READURL = `HBP_DATAPROXY_READURL`
const HBP_DATAPROXY_WRITEURL = `HBP_DATAPROXY_WRITEURL`

const {
  __DEBUG__,

  HBP_V2_REFRESH_TOKEN,
  HBP_V2_ACCESS_TOKEN,

  REDIS_PROTO,
  REDIS_ADDR,
  REDIS_PORT,

  REDIS_RATE_LIMITING_DB_EPHEMERAL_PORT_6379_TCP_PROTO,
  REDIS_RATE_LIMITING_DB_EPHEMERAL_PORT_6379_TCP_ADDR,
  REDIS_RATE_LIMITING_DB_EPHEMERAL_PORT_6379_TCP_PORT,

  REDIS_USERNAME,
  REDIS_PASSWORD,

  DATA_PROXY_URL,
  DATA_PROXY_BUCKETNAME,

} = process.env

const redisProto = REDIS_PROTO || REDIS_RATE_LIMITING_DB_EPHEMERAL_PORT_6379_TCP_PROTO || 'redis'
const redisAddr = REDIS_ADDR || REDIS_RATE_LIMITING_DB_EPHEMERAL_PORT_6379_TCP_ADDR || null
const redisPort = REDIS_PORT || REDIS_RATE_LIMITING_DB_EPHEMERAL_PORT_6379_TCP_PORT || 6379

const userPass = (() => {
  let returnString = ''
  if (REDIS_USERNAME) returnString += REDIS_USERNAME
  if (REDIS_PASSWORD) returnString += `:${REDIS_PASSWORD}`
  if (returnString.length > 0) returnString += `@`
  return returnString
})()

const redisURL = redisAddr && `${redisProto}://${userPass}${redisAddr}:${redisPort}`

class NotFoundError extends Error{}

// not part of class, since class is exported, and prototype of class can be easily changed
// using stderr instead of console.error, as by default, logs are collected via fluentd
// debug messages should not be kept as logs
function log(message){
  if (__DEBUG__) {
    process.stderr.write(`__DEBUG__`)
    process.stdout.write(`\n`)
    if (typeof message === 'object') {
      process.stderr.write(JSON.stringify(message, null, 2))
    }
    if (typeof message === 'number' || typeof message === 'string') {
      process.stdout.write(message)
    }
    process.stdout.write(`\n`)
  }
}


function _checkValid(urlString){
  log({
    breakpoint: '_checkValid',
    payload: urlString
  })
  if (!urlString) return false
  const url = new URL(urlString)
  const expiry = url.searchParams.get('temp_url_expires')
  return (new Date() - new Date(expiry)) < 1e3 * 10
}

class Store {
  constructor(){

    this.healthFlag = false
    this.seafileHandle = null
    this.seafileRepoId = null

    /**
     * setup redis(or mock) client
     */
    this.redisClient = redisURL
      ? redis.createClient({
          url: redisURL
        })
      : ({
          onCbs: [],
          keys: {},
          get: async (key, cb) => {
            await Promise.resolve()
            cb(null, this.keys[key])
          },
          set: async (key, value, cb) => {
            await Promise.resolve()
            this.keys[key] = value
            cb(null)
          },
          on(eventName, cb) {
            if (eventName === 'message') {
              this.onCbs.push(cb)
            }
          },
          publish(channel, message){
            for (const cb of this.onCbs){
              cb(channel, message)
            }
          },
          quit(){}
        })

    this.redisUtil = {
      asyncGet: promisify(this.redisClient.get).bind(this.redisClient),
      asyncSet: promisify(this.redisClient.set).bind(this.redisClient),
    }

    this.pending = {}
    this.keys = {}

    this.redisClient.on('message', async (chan, mess) => {
      /**
       * only liten to HBP_OIDC_V2_UPDATE_CHAN update
       */
      if (chan === HBP_OIDC_V2_UPDATE_CHAN) {
        try {
          const { pending, update } = JSON.parse(mess)
          this.pending = pending
          for (const key in update) {
            try {
              this.keys[key] = await this.redisUtil.asyncGet(key)
              console.log('on message get key', key, this.keys[key])
            } catch (e) {
              console.error(`[saneUrl][store.js] get key ${key} error`)
            }
          }
        } catch (e) {
          console.error(`[saneUrl][store.js] parse message HBP_OIDC_V2_UPDATE_CHAN error`)
        }
      }
    })
    
    this.init()

    /**
     * check expiry
     */
    this.intervalRef = setInterval(() => {
      this.checkExpiry()
    }, 1000 * 60)
  }

  async init() {
    this.keys = {
      [HBP_OIDC_V2_REFRESH_TOKEN_KEY]: (await this.redisUtil.asyncGet(HBP_OIDC_V2_REFRESH_TOKEN_KEY)) || HBP_V2_REFRESH_TOKEN,
      [HBP_OIDC_V2_ACCESS_TOKEN_KEY]: (await this.redisUtil.asyncGet(HBP_OIDC_V2_ACCESS_TOKEN_KEY)) || HBP_V2_ACCESS_TOKEN,
      [HBP_DATAPROXY_READURL]: await this.redisUtil.asyncGet(HBP_DATAPROXY_READURL),
      [HBP_DATAPROXY_WRITEURL]: await this.redisUtil.asyncGet(HBP_DATAPROXY_WRITEURL),
    }
    
    this.healthFlag = true
  }

  async checkExpiry(){

    const {
      [HBP_OIDC_V2_REFRESH_TOKEN_KEY]: refreshToken,
      [HBP_OIDC_V2_ACCESS_TOKEN_KEY]: accessToken
    } = this.keys

    log({
      breakpoint: 'async checkExpiry',
    })

    /**
     * if access token is absent
     * try to refresh token, without needing to check exp
     */
    if (!accessToken) {
      await this.doRefreshTokens()
      return true
    }
    const { exp: refreshExp } = jwtDecode(refreshToken)
    const { exp: accessExp } = jwtDecode(accessToken)

    const now = new Date().getTime() / 1000

    if (now > refreshExp) {
      console.warn(`[saneUrl] refresh token expired... Need a new refresh token`)
      return false
    }
    if (now > accessExp) {
      console.log(`[saneUrl] access token expired. Refreshing access token...`)
      await this.doRefreshTokens()
      console.log(`[saneUrl] access token successfully refreshed...`)
      return true
    }

    return true
  }

  async doRefreshTokens(){

    log({
      breakpoint: 'doing refresh tokens'
    })

    /**
     * first, check if another process/pod is currently updating
     * if they are, give them 1 minute to complete the process
     * (usually takes takes less than 5 seconds)
     */
    const pendingStart = this.pending[HBP_OIDC_V2_REFRESH_TOKEN_KEY] &&
      this.pending[HBP_OIDC_V2_REFRESH_TOKEN_KEY].start + 1000 * 60
    const now = new Date() 
    if (pendingStart && pendingStart > now) {
      return
    }

    /**
     * When start refreshing the tokens, set pending attribute, and start timestamp
     */
    const payload = {
      pending: {
        ...this.pending,
        [HBP_OIDC_V2_REFRESH_TOKEN_KEY]: {
          start: Date.now()
        }
      }
    }
    await this.redisClient.asyncSet(HBP_OIDC_V2_UPDATE_KEY, JSON.stringify(payload))
    this.redisClient.publish(HBP_OIDC_V2_UPDATE_CHAN, JSON.stringify(payload))

    const client = await getClient()
    const tokenset = await client.refresh(this.keys[HBP_OIDC_V2_REFRESH_TOKEN_KEY])
    const { access_token: accessToken, refresh_token: refreshToken } = tokenset

    const { exp: accessTokenExp } = jwtDecode(accessToken)
    const { exp: refreshTokenExp } = jwtDecode(refreshToken)

    if (refreshTokenExp - accessTokenExp < 60 * 60 ) {
      console.warn(`[saneUrl] refreshToken expires within 1 hour of access token! ${accessTokenExp} ${refreshTokenExp}`)
    }

    /**
     * once tokens have been refreshed, set them in the redis store first
     * Then publish the update message
     */
    await this.redisUtil.asyncSet(HBP_OIDC_V2_REFRESH_TOKEN_KEY, refreshToken)
    await this.redisUtil.asyncSet(HBP_OIDC_V2_ACCESS_TOKEN_KEY, accessToken)
    this.redisClient.publish(HBP_OIDC_V2_UPDATE_CHAN, JSON.stringify({
      keys: {
        [HBP_OIDC_V2_REFRESH_TOKEN_KEY]: refreshToken,
        [HBP_OIDC_V2_ACCESS_TOKEN_KEY]: accessToken,
      },
      pending: {
        ...this.pending,
        [HBP_OIDC_V2_REFRESH_TOKEN_KEY]: null
      }
    }))
    this.keys = {
      [HBP_OIDC_V2_REFRESH_TOKEN_KEY]: refreshToken,
      [HBP_OIDC_V2_ACCESS_TOKEN_KEY]: accessToken,
    }
  }

  async _getTmpUrl(permission){
    if (permission !== 'read' && permission !== 'write') throw new Error(`permission need to be either read or write!`)
    const method = permission === 'read'
      ? 'GET'
      : 'PUT'
    log({
      breakpoint: 'access key',
      access: this.keys[HBP_OIDC_V2_ACCESS_TOKEN_KEY]
    })
    const { url } = await new Promise((rs, rj) => {
      const payload = {
        method,
        uri: `${DATA_PROXY_URL}/tempurl/${DATA_PROXY_BUCKETNAME}?lifetime=very_long`,
        headers: {
          'Authorization': `Bearer ${this.keys[HBP_OIDC_V2_ACCESS_TOKEN_KEY]}`
        }
      }
      log({
        breakpoint: '_getTmpUrl',
        payload
      })
      request(payload, (err, resp, body) => {
        if (err) return rj(err)
        if (resp.statusCode >= 400) return rj(new Error(`${resp.statusCode}: ${resp.statusMessage}`))
        if (resp.statusCode === 200) {
          rs(JSON.parse(body))
          return
        }
        return rj(new Error(`[saneurl] [get] unknown error`))
      })
    })

    return url
  }

  _getTmplTag(key, _strings, _proxyUrl, bucketName, id){
    const defaultReturn = `${_strings[0]}${_proxyUrl}${_strings[1]}${bucketName}${_strings[2]}${id}`
    if (!key) return defaultReturn
    const {
      [key]: urlOfInterest
    } = this.keys
    if (!urlOfInterest) return defaultReturn
    const url = new URL(urlOfInterest)
    url.pathname += id
    url.port = '443'
    return url
  }

  _getWriteTmplTag(...args) {
    return this._getTmplTag(HBP_DATAPROXY_WRITEURL, ...args)
  }

  _getReadTmplTag(...args){
    return this._getTmplTag(HBP_DATAPROXY_READURL, ...args)
  }

  async get(id) {
    log({
      breakpoint: 'async get',
      id
    })
    const {
      [HBP_DATAPROXY_READURL]: readUrl
    } = this.keys

    if (!_checkValid(readUrl)) {
      log({
        breakpoint: 'read url not valid, getting new url'
      })
      const url = await this._getTmpUrl('read')
      const payload = {
        keys: {
          [HBP_DATAPROXY_READURL]: url
        }
      }
      this.redisClient.publish(HBP_OIDC_V2_UPDATE_CHAN, JSON.stringify(payload))
      this.redisUtil.asyncSet(HBP_DATAPROXY_READURL, url)
      this.keys[HBP_DATAPROXY_READURL] = url
    }

    return await new Promise((rs, rj) => {
      request({
        method: 'GET',
        uri: this._getReadTmplTag`${DATA_PROXY_URL}/buckets/${DATA_PROXY_BUCKETNAME}/${encodeURIComponent(id)}`,
      }, (err, resp, body) => {
        if (err) return rj(err)
        if (resp.statusCode === 404) return rj(new NotFoundError())
        if (resp.statusCode >= 400) return rj(new Error(`${resp.statusCode}: ${resp.statusMessage}`))
        if (resp.statusCode === 200) return rs(body)
        return rj(new Error(`[saneurl] [get] unknown error`))
      })
    })
  }

  async _set(id, value) {
    const {
      [HBP_DATAPROXY_WRITEURL]: writeUrl
    } = this.keys

    if (!_checkValid(writeUrl)) {
      log({
        breakpoint: '_set',
        message: 'write url not valid, getting new one'
      })
      const url = await this._getTmpUrl('write')
      const payload = {
        keys: {
          [HBP_DATAPROXY_WRITEURL]: url
        }
      }
      this.redisClient.publish(HBP_OIDC_V2_UPDATE_CHAN, JSON.stringify(payload))
      this.redisUtil.asyncSet(HBP_DATAPROXY_WRITEURL, url)
      this.keys[HBP_DATAPROXY_WRITEURL] = url
      log({
        breakpoint: '_set',
        message: 'got new write url'
      })
    }

    await new Promise((rs, rj) => {
      const payload = {
        method: 'PUT',
        uri: this._getWriteTmplTag`${DATA_PROXY_URL}/buckets/${DATA_PROXY_BUCKETNAME}/${encodeURIComponent(id)}`,
        headers: {
          'content-type': 'text/plain; charset=utf-8'
        },
        body: value
      }
      log({
        breakpoint: 'pre set',
        payload
      })
      request(payload, (err, resp, body) => {
        if (err) return rj(err)
        if (resp.statusCode === 404) return rj(new NotFoundError())
        if (resp.statusCode >= 400) return rj(new Error(`${resp.statusCode}: ${resp.statusMessage}`))
        if (resp.statusCode >= 200 && resp.statusCode < 300) return rs(body)
        return rj(new Error(`[saneurl] [get] unknown error`))
      })
    })
  }

  async set(id, value) {
    const result = await this._set(id, value)
    return result
  }

  dispose(){
    clearInterval(this.intervalRef)
    this.redisClient && this.redisClient.quit()
  }

  async healthCheck(){
    return this.healthFlag
  }
}


exports.Store = Store
exports.NotFoundError = NotFoundError
