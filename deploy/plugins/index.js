/**
 * TODO
 * how to discover plugins?
 */

const express = require('express')
const router = express.Router()
const PLUGIN_URLS = (process.env.PLUGIN_URLS && JSON.stringify(process.env.PLUGIN_URLS.split(';'))) || []
const STAGING_PLUGIN_URLS = (process.env.STAGING_PLUGIN_URLS && JSON.stringify(process.env.STAGING_PLUGIN_URLS.split(';'))) || []

router.get('', (_req, res) => {
  return res.status(200).json([
    ...PLUGIN_URLS,
    ...STAGING_PLUGIN_URLS
  ])
})

module.exports = router