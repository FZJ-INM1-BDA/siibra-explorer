const kgQueryUtil = require('./../auth/util')

let getPublicAccessToken

const getUserKGRequestParam = async ({ user }) => {
  let publicAccessToken
  /**
   * n.b. ACCESS_TOKEN env var is usually only set during dev
   */
  const accessToken = (user && user.tokenset && user.tokenset.access_token) || process.env.ACCESS_TOKEN
  const releasedOnly = !accessToken
  if (!accessToken && getPublicAccessToken) {
    publicAccessToken = await getPublicAccessToken()
  }
  const option = accessToken || publicAccessToken
    ? {
        auth: { bearer: accessToken || publicAccessToken }
      }
    : {}

  return {
    option,
    releasedOnly,
    token: accessToken || publicAccessToken
  }
}

const init = async () => {
  if (process.env.ACCESS_TOKEN) {
    if (process.env.NODE_ENV === 'production') console.error(`ACCESS_TOKEN set in production!`)
    else console.warn(`ACCESS_TOKEN environmental variable is set! All queries will be made made with ACCESS_TOKEN!`)
  }
  if (getPublicAccessToken) return
  const { getPublicAccessToken: getPublic } = await kgQueryUtil()
  getPublicAccessToken = getPublic
}

const defaultConfig = {
  retries: 3,
  timeout: 5000
}

const retry = (fn, config = {}) => {
  let retryId, retriesAttempted = 0
  const timeout = config.timeout || defaultConfig.timeout || 5000
  const retries = config.retries || defaultConfig.retries || 3
  retryId = setInterval(() => {
    retriesAttempted += 1
    fn()
      .then(() => {
        console.log(`retry succeeded, clearing retryId`)
        clearInterval(retryId)
      }).catch(e => {
        console.warn(`retry ${retriesAttempted}/${retries} failed.`)
        if (retriesAttempted >= retries) {
          console.warn(`maximum retires exceeded, terminating`)
          clearInterval(retryId)
        }
        else console.warn(`retrying in ${timeout} seconds`)
      })
  }, timeout)
}

module.exports = {
  init,
  getUserKGRequestParam,
  retry
}