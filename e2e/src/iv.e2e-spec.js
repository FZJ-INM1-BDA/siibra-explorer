const chromeOpts = require('../chromeOpts')
const noErrorLog = require('./noErrorLog')
const { getSelectedTemplate, getSelectedParcellation, getSelectedRegions, getCurrentNavigationState, awaitNehubaViewer } = require('./ivApi')
const { getSearchParam, wait } = require('./util')
const { URLSearchParams } = require('url')

const { waitMultiple } = require('./util')

describe('protractor works', () => {
  it('protractor works', () => {
    expect(true).toEqual(true)
  })
})

const pptr = require('puppeteer')
const ATLAS_URL = (process.env.ATLAS_URL || 'http://localhost:3000').replace(/\/$/, '')
if (ATLAS_URL.length === 0) throw new Error(`ATLAS_URL must either be left unset or defined.`)
if (ATLAS_URL[ATLAS_URL.length - 1] === '/') throw new Error(`ATLAS_URL should not trail with a slash: ${ATLAS_URL}`)

let browser
describe('IAV', () => {
  beforeAll(async () => {
    browser = await pptr.launch({
      ...(
        chromeOpts.indexOf('--headless') >= 0
          ? { headless: true }
          : {}
      ),
      args: [
        ...chromeOpts
      ]
    })
  })

  // TODO figure out how to get jasmine to compare array members
  describe('api', () => {
    const urlMni152JuBrain = `${ATLAS_URL}/?templateSelected=MNI+152+ICBM+2009c+Nonlinear+Asymmetric&parcellationSelected=JuBrain+Cytoarchitectonic+Atlas&cRegionsSelected=%7B%22jubrain+mni152+v18+left%22%3A%222%22%2C%22jubrain+mni152+v18+right%22%3A%222%22%7D&cNavigation=0.0.0.-W000..2_ZG29.-ASCS.2-8jM2._aAY3..BSR0..70hl~.1w4W0~.70hk..1Pl9`
    describe('selectRegion obs', () => {
      it('should populate selected region with inherited properties', async () => {
        const page = await browser.newPage()
        await page.goto(urlMni152JuBrain, {waitUntil: 'networkidle2'})
        const regions = await getSelectedRegions(page)
        for (const region of regions){
          expect(region.relatedAreas).toBeDefined()
          expect(
            region.relatedAreas.map(({ name }) => name).sort()
          ).toEqual(
            [
              'Area 44v',
              'Area 44d'
            ].sort()
          )
        }
      })
    })
  })
  
  describe('Url parsing', () => {
    

    it('pluginStates should result in call to fetch pluginManifest', async () => {
      const searchParam = new URLSearchParams()
      searchParam.set('templateSelected', 'MNI 152 ICBM 2009c Nonlinear Asymmetric')
      searchParam.set('parcellationSelected', 'JuBrain Cytoarchitectonic Atlas')
      searchParam.set('pluginStates', 'http://localhost:3001/manifest.json')
      
      const page = await browser.newPage()

      await page.setRequestInterception(true)

      const externalApi = {
        manifestCalled: false,
        templateCalled: false,
        scriptCalled: false
      }

      page.on('request', async req => {
        const url = await req.url()
        switch (url) {
          case 'http://localhost:3001/manifest.json': {
            externalApi.manifestCalled = true
            req.respond({
              content: 'application/json',
              headers: { 'Access-Control-Allow-Origin': '*' },
              body: JSON.stringify({
                name: 'test plugin',
                templateURL: 'http://localhost:3001/template.html',
                scriptURL: 'http://localhost:3001/script.js'
              })
            })
            break;
          }
          case 'http://localhost:3001/template.html': {
            externalApi.templateCalled = true
            req.respond({
              content: 'text/html; charset=UTF-8',
              headers: { 'Access-Control-Allow-Origin': '*' },
              body: ''
            })
            break;
          }
          case 'http://localhost:3001/script.js': {
            externalApi.scriptCalled = true
            req.respond({
              content: 'application/javascript',
              headers: { 'Access-Control-Allow-Origin': '*' },
              body: ''
            })
            break;
          }
          default: req.continue()
        }
      })

      await page.goto(`${ATLAS_URL}/?${searchParam.toString()}`, { waitUntil: 'networkidle2' })
      // await awaitNehubaViewer(page)
      await page.waitFor(500 * waitMultiple)

      expect(externalApi.manifestCalled).toBe(true)
      expect(externalApi.templateCalled).toBe(true)
      expect(externalApi.scriptCalled).toBe(true)

    })
  })
})
