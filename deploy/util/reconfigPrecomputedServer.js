/**
 * n.b. trailing slash is required
 * e.g. http://localhost:10080/
 */
const PRECOMPUTED_SERVER = process.env.PRECOMPUTED_SERVER

const reconfigureFlag = !!PRECOMPUTED_SERVER

exports.reconfigureFlag = reconfigureFlag

exports.reconfigureUrl = (str) => {
  if (!reconfigureFlag) return str
  return str.replace(/precomputed:\/\/https?:\/\/.*?\//g, `precomputed://${PRECOMPUTED_SERVER}`)
}