const chromeOpts = require('../chromeOpts')
const noErrorLog = require('./noErrorLog')
const { getSelectedTemplate, getSelectedParcellation, getSelectedRegions } = require('./ivApi')
const { getSearchParam, wait } = require('./util')
const { URLSearchParams } = require('url')

describe('protractor works', () => {
  it('protractor works', () => {
    expect(true).toEqual(true)
  })
})

const pptr = require('puppeteer')
const ATLAS_URL = process.env.ATLAS_URL || 'http://localhost:3000'
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
  
  // tracking issue: https://github.com/HumanBrainProject/interactive-viewer/issues/455
  // reenable when fixed
  // describe('Url parsing', () => {
    
  //   it('incorrectly defined templateSelected should clear searchparam', async () => {
  //     const search = '/?templateSelected=NoName2&parcellationSelected=NoName'
  //     const page = await browser.newPage()
  //     await page.goto(`${ATLAS_URL}${search}`, {waitUntil: 'networkidle2'})
  //     await page.waitFor(500)
  //     const searchParam = await getSearchParam(page)
  //     const searchParamObj = new URLSearchParams(searchParam)
  //     expect(searchParamObj.get('templateSelected')).toBeNull()
  //   })
  // })
})
