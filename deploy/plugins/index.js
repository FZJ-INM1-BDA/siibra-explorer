/**
 * TODO
 * how to discover plugins?
 */

const express = require('express')
const lruStore = require('../lruStore')
const got = require('got')
const { URL } = require('url')
const path = require("path")
const router = express.Router()
const V2_7_DEV_PLUGINS = (() => {
  try {
    return JSON.parse(
      process.env.V2_7_DEV_PLUGINS || `[]`
    )
  } catch (e) {
    console.warn(`Parsing DEV_PLUGINS failed: ${e}`)
    return []
  }
})()
const V2_7_PLUGIN_URLS = (process.env.V2_7_PLUGIN_URLS && process.env.V2_7_PLUGIN_URLS.split(';')) || []
const V2_7_STAGING_PLUGIN_URLS = (process.env.V2_7_STAGING_PLUGIN_URLS && process.env.V2_7_STAGING_PLUGIN_URLS.split(';')) || []

router.get('', (_req, res) => {
  return res.status(200).json([
    ...V2_7_PLUGIN_URLS,
    ...V2_7_STAGING_PLUGIN_URLS
  ])
})

const getKey = url => `plugin:manifest-cache:${url}}`

router.get('/manifests', async (_req, res) => {

  const allManifests = await Promise.all([
    ...V2_7_PLUGIN_URLS,
    ...V2_7_STAGING_PLUGIN_URLS
  ].map(async url => {
    const key = getKey(url)
    
    await lruStore._initPr
    const { store } = lruStore
    
    try {
      const storedManifest = await store.get(key)
      if (storedManifest) return JSON.parse(storedManifest)
      else throw `not found`
    } catch (e) {
      const resp = await got(url)
      const json = JSON.parse(resp.body)

      const { iframeUrl, 'siibra-explorer': flag } = json
      if (!flag) return null
      if (!iframeUrl) return null
      const u = new URL(url)
      
      let replaceObj = {}
      if (!/^https?:\/\//.test(iframeUrl)) {
        u.pathname = path.resolve(path.dirname(u.pathname), iframeUrl)
        replaceObj['iframeUrl'] = u.toString()
      }
      const returnObj = {...json, ...replaceObj}
      await store.set(key, JSON.stringify(returnObj), { maxAge: 1000 * 60 * 60 })
      return returnObj
    }
  }))

  res.status(200).json(
    [...V2_7_DEV_PLUGINS, ...allManifests.filter(v => !!v)]
  )
})

module.exports = router