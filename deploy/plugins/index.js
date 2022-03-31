/**
 * TODO
 * how to discover plugins?
 */

const express = require('express')
const lruStore = require('../lruStore')
const { race } = require("../../common/util")
const got = require('got')
const router = express.Router()
const DEV_PLUGINS = (() => {
  try {
    return JSON.parse(
      process.env.DEV_PLUGINS || `[]`
    )
  } catch (e) {
    console.warn(`Parsing DEV_PLUGINS failed: ${e}`)
    return []
  }
})()
const PLUGIN_URLS = (process.env.PLUGIN_URLS && process.env.PLUGIN_URLS.split(';')) || []
const STAGING_PLUGIN_URLS = (process.env.STAGING_PLUGIN_URLS && process.env.STAGING_PLUGIN_URLS.split(';')) || []

router.get('', (_req, res) => {
  return res.status(200).json([
    ...PLUGIN_URLS,
    ...STAGING_PLUGIN_URLS
  ])
})

const getKey = url => `plugin:manifest-cache:${url}`

router.get('/manifests', async (_req, res) => {

  const output = []
  for (const plugin of [ ...PLUGIN_URLS, ...STAGING_PLUGIN_URLS ]) {
    try {
      await race(async () => {
        const key = getKey(plugin)
        try {
          const result = await race(async () => {
            await lruStore._initPr
            const { store } = lruStore
            const storedManifest = await store.get(key)
            if (storedManifest) {
              return JSON.parse(storedManifest)
            } else {
              throw `not found`
            }
          }, { timeout: 100 })
          output.push(result)
        } catch (e) {
          const resp = await got(plugin)
          const json = JSON.parse(resp.body)
          
          output.push(json)
          store.set(key, JSON.stringify(json), { maxAge: 1000 * 60 * 60 })
            .catch(e => console.error(`setting store value error`, e))
        }
      })
    } catch (e) {
      console.error(`racing to get manifest ${plugin} timed out or errored.`, e)
    }
  }
  

  res.status(200).json(
    [...DEV_PLUGINS, ...output]
  )
})

module.exports = router