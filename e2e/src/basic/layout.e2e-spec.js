const { LayoutPage } = require('../util')

const MAT_SIDENAV_TIMEOUT = 500

describe('> sidenav', () => {
  let layoutPage
  let toggleTab
  let sidenav

  beforeEach(async () => {
    layoutPage = new LayoutPage()
    await layoutPage.init()
    await layoutPage.goto('/?templateSelected=MNI+152+ICBM+2009c+Nonlinear+Asymmetric&parcellationSelected=JuBrain+Cytoarchitectonic+Atlas')
    await layoutPage.wait(MAT_SIDENAV_TIMEOUT)
    await layoutPage.dismissModal()

    toggleTab = await layoutPage.getSideNavTag()
    sidenav = await layoutPage.getSideNav()
  })

  it('> on init, side panel should be visible', async () => {
    const sideNavIsDisplayed = await sidenav.isDisplayed()
    expect(sideNavIsDisplayed).toEqual(true)

    const toggleTabIsDIsplayed = await toggleTab.isDisplayed()
    expect(toggleTabIsDIsplayed).toEqual(true)
  })

  describe('> toggling', () => {
    it('> toggle tab should toggle side nav', async () => {
      const init = await sidenav.isDisplayed()
      expect(init).toEqual(true)

      await toggleTab.click()
      await layoutPage.wait(MAT_SIDENAV_TIMEOUT)
      const expectHidden = await sidenav.isDisplayed()
      expect(expectHidden).toEqual(false)

      await toggleTab.click()
      await layoutPage.wait(MAT_SIDENAV_TIMEOUT)
      const expectShown = await sidenav.isDisplayed()
      expect(expectShown).toEqual(true)
    })
  })
})

describe('> status panel', () => {

  let layoutPage
  let toggleTab
  let sidenav

  beforeEach(async () => {
    layoutPage = new LayoutPage()
    await layoutPage.init()
    await layoutPage.goto('/?templateSelected=MNI+152+ICBM+2009c+Nonlinear+Asymmetric&parcellationSelected=JuBrain+Cytoarchitectonic+Atlas')
    await layoutPage.wait(MAT_SIDENAV_TIMEOUT)
    await layoutPage.dismissModal()

    toggleTab = await layoutPage.getSideNavTag()
    sidenav = await layoutPage.getSideNav()

  })

  afterEach(() => {
    layoutPage = null
    toggleTab = null
    sidenav = null
    statusPanel = null
  })

  it('> on init, status panel should not be visible', async () => {
    let statusPanel
    try {
      statusPanel = await layoutPage.getStatusPanel()  
    } catch (e) {

    }

    if (statusPanel) {
      const init = await statusPanel.isDisplayed()
      expect(init).toEqual(false)
    }
  })

  it('> on toggling side panel, status panel should become visible', async () => {
    await toggleTab.click()
    await layoutPage.wait(MAT_SIDENAV_TIMEOUT)

    const statusPanel = await layoutPage.getStatusPanel()  
    const expectVisible = await statusPanel.isDisplayed()
    expect(expectVisible).toEqual(true)
  })

  it('> on click status panel, side nav become visible, status panel become invisible', async () => {

    await toggleTab.click()
    await layoutPage.wait(MAT_SIDENAV_TIMEOUT)

    const statusPanel = await layoutPage.getStatusPanel()  

    await statusPanel.click()
    await layoutPage.wait(MAT_SIDENAV_TIMEOUT)

    try {
      const expectHidden = await statusPanel.isDisplayed()
      expect(expectHidden).toEqual(false) 
    } catch (e) {

    }

    const expectVisible = await sidenav.isDisplayed()
    expect(expectVisible).toEqual(true)
  })
})
