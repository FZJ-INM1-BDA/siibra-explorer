const fs = require('fs')
const path = require('path')
const { promisify } = require('util')
const asyncWrite = promisify(fs.writeFile)

const main = async () => {
  const pathToEnvFile = path.join(__dirname, './environment.prod.ts')
  const {
    BACKEND_URL,
    DATASET_PREVIEW_URL,
    STRICT_LOCAL,
    MATOMO_URL,
    MATOMO_ID,
    BS_REST_URL,
    VERSION,
    GIT_HASH = 'unknown hash',
    EXPERIMENTAL_FEATURE_FLAG
  } = process.env
  const version = JSON.stringify(
    VERSION || 'unknown version'
  )
  const gitHash = JSON.stringify(
    GIT_HASH || 'unknown hash'
  )

  const outputTxt = `
import { environment as commonEnv } from './environment.common'
export const environment = {
  ...commonEnv,
  GIT_HASH: ${gitHash},
  VERSION: ${version},
  BS_REST_URL: ${JSON.stringify(BS_REST_URL)},
  BACKEND_URL: ${JSON.stringify(BACKEND_URL)},
  DATASET_PREVIEW_URL: ${JSON.stringify(DATASET_PREVIEW_URL)},
  STRICT_LOCAL: ${JSON.stringify(STRICT_LOCAL)},
  MATOMO_URL: ${JSON.stringify(MATOMO_URL)},
  MATOMO_ID: ${JSON.stringify(MATOMO_ID)},
  EXPERIMENTAL_FEATURE_FLAG: ${EXPERIMENTAL_FEATURE_FLAG}
}
`
  await asyncWrite(pathToEnvFile, outputTxt, 'utf-8')
}

main()
