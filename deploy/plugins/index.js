/**
 * TODO
 * how to discover plugins?
 */

const express = require('express')
const { store } = require('../lruStore')
const got = require('got')
const router = express.Router()
const PLUGIN_URLS = (process.env.PLUGIN_URLS && process.env.PLUGIN_URLS.split(';')) || []
const STAGING_PLUGIN_URLS = (process.env.STAGING_PLUGIN_URLS && process.env.STAGING_PLUGIN_URLS.split(';')) || []

router.get('', (_req, res) => {
  return res.status(200).json([
    ...PLUGIN_URLS,
    ...STAGING_PLUGIN_URLS
  ])
})

const getKey = url => `plugin:manifest-cache:${url}}`

router.get('/manifests', async (_req, res) => {

  const allManifests = await Promise.all([
    ...PLUGIN_URLS,
    ...STAGING_PLUGIN_URLS
  ].map(async url => {
    const key = getKey(url)
    try {
      const storedManifest = await store.get(key)
      if (storedManifest) return JSON.parse(storedManifest)
      else throw `not found`
    } catch (e) {
      const resp = await got(url)
      const json = JSON.parse(resp.body)
      
      await store.set(key, JSON.stringify(json), { maxAge: 1000 * 60 * 60 })
      return json
    }
  }))

  res.status(200).json(
    allManifests.filter(v => !!v)
  )
})

module.exports = router