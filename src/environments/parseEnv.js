const fs = require('fs')
const path = require('path')
const { promisify } = require('util')
const asyncWrite = promisify(fs.writeFile)
const asyncReadFile = promisify(fs.readFile)
const process = require("process")
const { exec } = require("child_process")


const getGitHead = () => new Promise((rs, rj) => {
  exec(`git rev-parse --short HEAD`, (err, stdout, stderr) => {
    if (err) return rj(err)
    if (stderr) return rj(stderr)
    rs(stdout)
  })
})

const getVersion = async () => {
  const content = await asyncReadFile("./package.json", "utf-8")
  const { version } = JSON.parse(content)
  return version
}

const main = async () => {
  const target = process.argv[2] || './environment.prod.ts'
  const pathToEnvFile = path.join(__dirname, target)
  const {
    BACKEND_URL,
    STRICT_LOCAL,
    MATOMO_URL,
    MATOMO_ID,
    SIIBRA_API_ENDPOINTS,
    EXPERIMENTAL_FEATURE_FLAG,
    ENABLE_LEAP_MOTION,
  } = process.env
  
  const version = JSON.stringify(
    await (async () => {
      try {
        return await getVersion()
      } catch (e) {
        return "unknown version"
      }
    })()
  )
  const gitHash = JSON.stringify(
    await (async () => {
      try {
        return await getGitHead()
      } catch (e) {
        return "unknown git hash"
      }
    })()
  )

  console.log(`[parseEnv.js] parse envvar:`, {
    BACKEND_URL,
    STRICT_LOCAL,
    MATOMO_URL,
    MATOMO_ID,
    SIIBRA_API_ENDPOINTS,
    EXPERIMENTAL_FEATURE_FLAG,
    ENABLE_LEAP_MOTION,

    VERSION: version,
    GIT_HASH: gitHash,
  })

  const outputTxt = `
import { environment as commonEnv } from './environment.common'
export const environment = {
  ...commonEnv,
  GIT_HASH: ${gitHash},
  VERSION: ${version},
  SIIBRA_API_ENDPOINTS: ${JSON.stringify(SIIBRA_API_ENDPOINTS)},
  BACKEND_URL: ${JSON.stringify(BACKEND_URL)},
  STRICT_LOCAL: ${STRICT_LOCAL},
  MATOMO_URL: ${JSON.stringify(MATOMO_URL)},
  MATOMO_ID: ${JSON.stringify(MATOMO_ID)},
  EXPERIMENTAL_FEATURE_FLAG: ${EXPERIMENTAL_FEATURE_FLAG},
  ENABLE_LEAP_MOTION: ${ENABLE_LEAP_MOTION}
}
`
  await asyncWrite(pathToEnvFile, outputTxt, 'utf-8')
}

main()
