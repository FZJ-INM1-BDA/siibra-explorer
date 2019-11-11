const router = require('express').Router()
const request = require('request')
const url = require('url')
const stream = require('stream')
const { getHandleErrorFn } = require('../util/streamHandleError')

let PROXY_HOSTNAME_WHITELIST

try{
  PROXY_HOSTNAME_WHITELIST = JSON.parse(process.env.PROXY_HOSTNAME_WHITELIST)
}catch(e){
  PROXY_HOSTNAME_WHITELIST = []
}

const whiteList = new Set([
  'object.cscs.ch',
  ...PROXY_HOSTNAME_WHITELIST
])

router.get('/file', (req, res) => {
  const { fileUrl } = req.query
  const f = url.parse(fileUrl)
  if(f && f.hostname && whiteList.has(f.hostname)) return request(fileUrl).pipe(res).on('error', getHandleErrorFn(req, res))
  else res.status(400).send()
})

module.exports = router