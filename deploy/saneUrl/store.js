const request = require('request')
const redis = require('redis')
const { promisify } = require('util')
const { Seafile } = require('hbp-seafile')
const { getClient } = require('../auth/hbp-oidc-v2')
const { jwtDecode } = require('../auth/oidc')
const { Readable } = require('stream')

const HBP_OIDC_V2_REFRESH_TOKEN_KEY = `HBP_OIDC_V2_REFRESH_TOKEN_KEY` // only insert valid refresh token. needs to be monitored to ensure always get new refresh token(s)
const HBP_OIDC_V2_ACCESS_TOKEN_KEY = `HBP_OIDC_V2_ACCESS_TOKEN_KEY` // only insert valid access token. if expired, get new one via refresh token, then pop & push
const HBP_SEAFILE_TOKEN_KEY = `HBP_SEAFILE_TOKEN_KEY` // only insert valid seafile token
const HBP_SEAFILE_UPDATE_KEY = `HBP_SEAFILE_UPDATE_KEY` // stringified JSON key val of above three, with time stamp

const {
  OBJ_STORAGE_ROOT_URL,

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
       * only liten to HBP_SEAFILE_UPDATE_KEY update
       */
      if (chan === HBP_SEAFILE_UPDATE_KEY) {
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
          console.error(`[saneUrl][store.js] parse message HBP_SEAFILE_UPDATE_KEY error`)
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
      [HBP_SEAFILE_TOKEN_KEY]: await this.redisUtil.asyncGet(HBP_SEAFILE_TOKEN_KEY),
    }
    
    await this.refreshSeafileHandle()
    const repos = await this.seafileHandle.getRepos()
    const repoToUse = repos.find(repo => repo.name === 'interactive-atlas-viewer')
    this.seafileRepoId = repoToUse.id
    
    this.healthFlag = true
  }

  async checkExpiry(){
    const {
      [HBP_OIDC_V2_REFRESH_TOKEN_KEY]: refreshToken,
      [HBP_OIDC_V2_ACCESS_TOKEN_KEY]: accessToken
    } = this.keys

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

    const now = new Date()

    if (now < refreshExp && now > accessExp) {
      console.log(`[saneUrl] access token expired. Refreshing access token...`)
      await this.doRefreshTokens()
      console.log(`[saneUrl] access token successfully refreshed...`)
      return true
    }

    return true
  }

  async doRefreshTokens(){

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
    this.redisClient.publish(HBP_SEAFILE_UPDATE_KEY, JSON.stringify({
      pending: {
        ...this.pending,
        [HBP_OIDC_V2_REFRESH_TOKEN_KEY]: {
          start: Date.now()
        }
      }
    }))
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
    this.redisClient.publish(HBP_SEAFILE_UPDATE_KEY, JSON.stringify({
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

  async refreshSeafileHandle(){
    await this.checkExpiry()
    const {
      [HBP_OIDC_V2_ACCESS_TOKEN_KEY]: accessToken,
      [HBP_SEAFILE_TOKEN_KEY]: token,
    } = this.keys
    this.seafileHandle = Seafile.from({
      token,
      accessToken
    })
    if (!token) {
      await this.seafileHandle.init()
    }
    return this.seafileHandle
  }

  tryGetFromSwiftObj(id) {
    if (!OBJ_STORAGE_ROOT_URL){
      return Promise.reject(
        new NotFoundError()
      )
    }
    return new Promise((rs, rj) => {
      request.get(`${OBJ_STORAGE_ROOT_URL}/${id}`, (err, resp, body) => {
        if (err) return rj(err)
        if (resp.statusCode === 404) return rj(new NotFoundError())
        if (resp.statusCode >= 400) return rj(resp)
        return rs(body)
      })
    })
  }

  async tryGetFromSeafile(id) {
    const getFiles = async () => {
      return await this.seafileHandle.ls({
        repoId: this.seafileRepoId,
        dir: `/saneurl/`
      })
    }
    let files
    try {
      files = await getFiles()
    } catch (e) {
      await this.refreshSeafileHandle()
      files = await getFiles()
    }

    if (!files.find(f => f.name === id)) {
      throw new NotFoundError()
    }

    const getFile = async () => {
      return await this.seafileHandle.readFile({
        dir: `/saneurl/${id}`,
        repoId: this.seafileRepoId
      })
    }

    try {
      return await getFile()
    } catch (e) {
      this.refreshSeafileHandle()
      return await getFile()
    }
  }

  async get(id) {
    try {
      return await this.tryGetFromSwiftObj(id)
    } catch (e) {
      if (e instanceof NotFoundError) {
        /**
         * try get file from seafile
         */
        
         return await this.tryGetFromSeafile(id)
      } else {
        throw new Error(`Unknown Error: ${e}`)
      }
    }
  }

  async _set(id, value) {
    const rs = new Readable()
    rs.path = id
    rs.push(value)
    rs.push(null)
    const uploadToSeafile = async () => {
      await this.seafileHandle.uploadFile({
        filename: id,
        readStream: rs,
      }, {
        repoId: this.seafileRepoId,
        dir: '/saneurl/'
      })
    }
    try {
      await uploadToSeafile()
    } catch (e) {
      await this.refreshSeafileHandle()
      await uploadToSeafile()
    }
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
