const { LayoutPage } = require('../util')

const MAT_SIDENAV_TIMEOUT = 500

describe('> sidenav', () => {
  let layoutPage

  beforeEach(async () => {
    layoutPage = new LayoutPage()
    await layoutPage.init()
    await layoutPage.goto('/?templateSelected=MNI+152+ICBM+2009c+Nonlinear+Asymmetric&parcellationSelected=JuBrain+Cytoarchitectonic+Atlas')
    await layoutPage.wait(MAT_SIDENAV_TIMEOUT)
    await layoutPage.dismissModal()
  })

  it('> on init, side panel should be visible', async () => {
    const sideNavIsDisplayed = await layoutPage.sideNavIsVisible()
    expect(sideNavIsDisplayed).toEqual(true)

    const toggleTabIsDIsplayed = await layoutPage.sideNavTabIsVisible()
    expect(toggleTabIsDIsplayed).toEqual(true)
  })

  describe('> toggling', () => {
    it('> toggle tab should toggle side nav', async () => {
      const init = await layoutPage.sideNavIsVisible()
      expect(init).toEqual(true)

      await layoutPage.clickSideNavTab()
      await layoutPage.wait(MAT_SIDENAV_TIMEOUT)
      const expectHidden = await layoutPage.sideNavIsVisible()
      expect(expectHidden).toEqual(false)

      await layoutPage.clickSideNavTab()
      await layoutPage.wait(MAT_SIDENAV_TIMEOUT)
      const expectShown = await layoutPage.sideNavIsVisible()
      expect(expectShown).toEqual(true)
    })
  })
})

describe('> status panel', () => {

  let layoutPage

  beforeEach(async () => {
    layoutPage = new LayoutPage()
    await layoutPage.init()
    await layoutPage.goto('/?templateSelected=MNI+152+ICBM+2009c+Nonlinear+Asymmetric&parcellationSelected=JuBrain+Cytoarchitectonic+Atlas')
    await layoutPage.wait(MAT_SIDENAV_TIMEOUT)
    await layoutPage.dismissModal()
  })

  afterEach(() => {
    layoutPage = null
  })

  it('> on init, status panel should not be visible', async () => {
    
    const init = await layoutPage.statusPanelIsVisible()
    expect(init).toEqual(false)
  })

  it('> on toggling side panel, status panel should become visible', async () => {
    await layoutPage.clickSideNavTab()
    await layoutPage.wait(MAT_SIDENAV_TIMEOUT)

    const expectVisible = await layoutPage.statusPanelIsVisible()
    expect(expectVisible).toEqual(true)
  })

  it('> on click status panel, side nav become visible, status panel become invisible', async () => {

    await layoutPage.clickSideNavTab()
    await layoutPage.wait(MAT_SIDENAV_TIMEOUT)
  
    await layoutPage.clickStatusPanel()
    await layoutPage.wait(MAT_SIDENAV_TIMEOUT)

    const expectHidden = await layoutPage.statusPanelIsVisible()
    expect(expectHidden).toEqual(false) 
    
    const expectVisible = await layoutPage.sideNavIsVisible()
    expect(expectVisible).toEqual(true)
  })
})
