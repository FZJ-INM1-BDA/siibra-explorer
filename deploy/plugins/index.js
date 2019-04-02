/**
 * TODO
 * how to discover plugins?
 */

const express = require('express')
const router = express.Router()
const PLUGIN_URLS = process.env.PLUGIN_URLS && JSON.stringify(process.env.PLUGIN_URLS.split(';'))

router.get('', (_req, res) => {

  if (PLUGIN_URLS) {
    return res.status(200).send(PLUGIN_URLS)
  } else {
    return res.status(200).send('[]')
  }
})

module.exports = router