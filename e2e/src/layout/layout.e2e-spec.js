const chromeOpts = require('../../chromeOpts')
const pptr = require('puppeteer')
const ATLAS_URL = (process.env.ATLAS_URL || 'http://localhost:3000').replace(/\/$/, '')
if (ATLAS_URL.length === 0) throw new Error(`ATLAS_URL must either be left unset or defined.`)
if (ATLAS_URL[ATLAS_URL.length - 1] === '/') throw new Error(`ATLAS_URL should not trail with a slash: ${ATLAS_URL}`)

const MAT_SIDENAV_TIMEOUT = 500

const getVisibility = page => async selector => await page.evaluate(sel => {
  const el = document.querySelector(sel)
  if (el) return el.style.visibility
  else return null
}, selector)

const clickTab = async page => {
  await page.evaluate(() => {
    const el = document.querySelector('button[mat-drawer-trigger]')
    el.click()
  })
}

let browser
describe('IAV layout e2e', () => {
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

  describe('toggling side panel', () => {
    let page

    beforeAll(async () => {
      const urlMni152JuBrain = `${ATLAS_URL}/?templateSelected=MNI+152+ICBM+2009c+Nonlinear+Asymmetric&parcellationSelected=JuBrain+Cytoarchitectonic+Atlas&cRegionsSelected=%7B%22jubrain+mni152+v18+left%22%3A%222%22%2C%22jubrain+mni152+v18+right%22%3A%222%22%7D&cNavigation=0.0.0.-W000..2_ZG29.-ASCS.2-8jM2._aAY3..BSR0..70hl~.1w4W0~.70hk..1Pl9`
      page = await browser.newPage()
      await page.goto(urlMni152JuBrain, {waitUntil: 'networkidle2'})
      await page.waitFor('mat-drawer')
    })

    it('on init, side drawer should be visible', async () => {
      const visibility = await (getVisibility(page))('mat-drawer[mat-drawer-opened]')
      expect(
        visibility
      ).toBe('visible')
    })

    it('toggle tab should hide', async () => {
      await clickTab(page)
      await page.waitFor('mat-drawer[mat-drawer-opened=false]')
      await page.waitFor(MAT_SIDENAV_TIMEOUT)

      const visibility = await (getVisibility(page))('mat-drawer[mat-drawer-opened]')
      expect(
        visibility
      ).toBe('hidden')
    })

    it('toggle tab should show', async () => {
      await clickTab(page)
      await page.waitFor('mat-drawer[mat-drawer-opened=true]')
      await page.waitFor(MAT_SIDENAV_TIMEOUT)

      const visibility = await (getVisibility(page))('mat-drawer[mat-drawer-opened]')
      expect(
        visibility
      ).toBe('visible')
    })

    it('sidepanel property window should be hidden when side panel is shown', async () => {

      const visibility = await (getVisibility(page))('mat-drawer[mat-drawer-opened]')
      expect(
        visibility
      ).toBe('visible')

      const statusPanel = await page.$('[mat-drawer-status-panel]')
      expect(statusPanel).toBeNull
    })

    it('side panel property window should be visible when panel is hidden', async () => {
      await clickTab(page)

      await page.waitFor('mat-drawer[mat-drawer-opened=false]')
      await page.waitFor(MAT_SIDENAV_TIMEOUT)
      const visibility = await (getVisibility(page))('mat-drawer[mat-drawer-opened]')
      expect(
        visibility
      ).toBe('hidden')

      const statusPanel = await page.$('[mat-drawer-status-panel]')
      expect(statusPanel).toBeTruthy
    })

    it('side panel, if visible, should open side panel', async () => {

      const statusPanel = await page.$('[mat-drawer-status-panel]')
      expect(statusPanel).toBeTruthy

      await page.evaluate(() => {
        const el = document.querySelector('[mat-drawer-status-panel]')
        if (el) el.click()
        else throw new Error(`mat-drawer-status-panel not found`)
      })

      await page.waitFor(MAT_SIDENAV_TIMEOUT)
      
      const visibility = await (getVisibility(page))('mat-drawer[mat-drawer-opened]')
      expect(
        visibility
      ).toBe('visible')
    })

    it('after open with status panel, tag should continue to work', async () => {
      await clickTab(page)

      await page.waitFor('mat-drawer[mat-drawer-opened=false]')
      await page.waitFor(MAT_SIDENAV_TIMEOUT)
      const visibility = await (getVisibility(page))('mat-drawer[mat-drawer-opened]')
      expect(
        visibility
      ).toBe('hidden')
    })
  })
})
