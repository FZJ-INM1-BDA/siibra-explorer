const express = require('express')
const router = express.Router()

console.log(`BUILD_TEXT: ${process.env.BUILD_TEXT}`)

/**
 * build flag
 */
const BUILD_TEXT = process.env.BUILD_TEXT || ''
const versionCss = ` /* overwritten */
body::after
{
  content: '${BUILD_TEXT}';
}
`
const buildTextIsDefined = typeof process.env.BUILD_TEXT !== 'undefined'

/**
 * bypass if env var not defined
 * i.e. in order to show nothing, must EXPLICITLY set envvar BUILD_TEXT as empty string
 */
router.get('/version.css', (req, res, next) => {
  console.log(`runtime BUILD_TEXT: ${process.env.BUILD_TEXT}`)
  if (!buildTextIsDefined) return next()
  res.setHeader('Content-Type', 'text/css; charset=UTF-8')
  res.status(200).send(versionCss)
})

module.exports = router