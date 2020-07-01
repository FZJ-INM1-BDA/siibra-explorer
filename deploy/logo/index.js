const fs = require('fs')
const path = require('path')
const { getHandleErrorFn } = require('../util/streamHandleError')
const router = require('express').Router()

const map = new Map([
  ['hbp', {
    mimetype: 'image/png',
    light: 'HBP_Primary_RGB_BlackText.png',
    dark: 'HBP_Primary_RGB_WhiteText.png'
  }],
  ['ebrains', {
    mimetype: 'image/svg+xml',
    light: 'ebrains-logo-dark.svg',
    dark: 'ebrains-logo-light.svg'
  }],
  ['fzj', {
    mimetype: 'image/svg+xml',
    light: 'fzj_black_transparent_svg.svg',
    dark: 'fzj_white_transparent_svg.svg'
  }]
])

router.get('/', (req, res) => {
  
  const USE_LOGO = process.env.USE_LOGO || 'hbp'
  const { mimetype, light, dark } = map.get(USE_LOGO) || map.get('hbp')
  const darktheme = !!req.query.darktheme
  try {
    res.setHeader('Content-type', mimetype)
    fs.createReadStream(
      path.join(__dirname, `assets/${darktheme ? dark : light}`)
    ).pipe(res).on('error', getHandleErrorFn(req, res))
  } catch (e) {
    console.error(`Fetching logo error ${e.toString()}`)
    res.status(500).end()
  }
})

module.exports = router