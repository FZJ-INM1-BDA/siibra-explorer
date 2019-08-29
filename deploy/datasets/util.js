const kgQueryUtil = require('./../auth/util')

let getPublicAccessToken, publicAccessToken

const getUserKGRequestParam = async ({ user }) => {
  /**
   * n.b. ACCESS_TOKEN env var is usually only set during dev
   */
  const accessToken = (user && user.tokenset && user.tokenset.access_token) || process.env.ACCESS_TOKEN
  const releasedOnly = !accessToken
  if (!accessToken && !publicAccessToken && getPublicAccessToken) {
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
  if (getPublicAccessToken) return
  const { getPublicAccessToken: getPublic } = await kgQueryUtil()
  getPublicAccessToken = getPublic
}

module.exports = {
  init,
  getUserKGRequestParam
}