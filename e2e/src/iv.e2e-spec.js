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
    
    // tracking issue: https://github.com/HumanBrainProject/interactive-viewer/issues/455
    // reenable when fixed
    // it('incorrectly defined templateSelected should clear searchparam', async () => {
    //   const search = '/?templateSelected=NoName2&parcellationSelected=NoName'
    //   const page = await browser.newPage()
    //   await page.goto(`${ATLAS_URL}${search}`, {waitUntil: 'networkidle2'})
    //   await page.waitFor(500)
    //   const searchParam = await getSearchParam(page)
    //   const searchParamObj = new URLSearchParams(searchParam)
    //   expect(searchParamObj.get('templateSelected')).toBeNull()
    // })


    it('navigation state should be perserved', async () => {
      const searchParam = `/?templateSelected=Big+Brain+%28Histology%29&parcellationSelected=Cytoarchitectonic+Maps&cNavigation=zvyba.z0UJ7._WMxv.-TTch..2_cJ0e.2-OUQG._a9qP._QPHw..7LIx..2CQ3O.1FYC.259Wu..2r6`
      const expectedNav = {
        "position": [
          36806872,
          325772,
          34904120
        ],
        "orientation": [
          0.1131771132349968,
          0.031712327152490616,
          0.2527998387813568,
          0.9603527784347534
        ],
        "zoom": 11590,
        "perspectiveZoom": 1922235,
        "perspectiveOrientation": [
          -0.2991955280303955,
          -0.8824243545532227,
          0.28244855999946594,
          0.22810545563697815
        ]
      }

      const page = await browser.newPage()
      await page.goto(`${ATLAS_URL}${searchParam}`, { waitUntil: 'networkidle2' })
      await awaitNehubaViewer(page)
      await page.waitFor(1000 * waitMultiple)

      const actualNav = await getCurrentNavigationState(page)
      expect(expectedNav).toEqual(actualNav)
    })

    it('pluginStates should result in call to fetch pluginManifest', async () => {
      const searchParam = new URLSearchParams()
      // searchParam.set('templateSelected', 'Big Brain (Histology)')
      // searchParam.set('parcellationSelected', 'Grey/White matter')
      searchParam.set('pluginStates', 'http://localhost:3001/manifest.json')
      
      const page = await browser.newPage()

      await page.setRequestInterception(true)

      const result = {
        manifestCalled: false,
        templateCalled: false,
        scriptCalled: false
      }

      page.on('request', async req => {
        const url = await req.url()
        switch (url) {
          case 'http://localhost:3001/manifest.json': {
            result.manifestCalled = true
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
            result.templateCalled = true
            req.respond({
              content: 'text/html; charset=UTF-8',
              headers: { 'Access-Control-Allow-Origin': '*' },
              body: ''
            })
            break;
          }
          case 'http://localhost:3001/script.js': {
            result.scriptCalled = true
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

      expect(result.manifestCalled).toBeTrue
      expect(result.templateCalled).toBeTrue
      expect(result.scriptCalled).toBeTrue

      console.log(`yas`)

    })
  })
})
