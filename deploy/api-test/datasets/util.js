
const fs = require('fs')
const SERVICE_ACCOUNT_CRED = JSON.parse(
  process.env.SERVICE_ACCOUNT_CRED || 
  (process.env.SERVICE_ACCOUNT_CRED_PATH && fs.readFileSync(process.env.SERVICE_ACCOUNT_CRED_PATH, 'utf-8')) ||
  '{}')

const setupAuth = async doc => {
  await doc.useServiceAccountAuth(SERVICE_ACCOUNT_CRED)
  await doc.loadInfo()
}

module.exports = {
  setupAuth
}