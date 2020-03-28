const { AtlasPage } = require('../util')

const MAT_SIDENAV_TIMEOUT = 500

describe('> sidenav', () => {
  let atlasPage

  beforeEach(async () => {
    atlasPage = new AtlasPage()
    await atlasPage.init()
    await atlasPage.goto('/?templateSelected=MNI+152+ICBM+2009c+Nonlinear+Asymmetric&parcellationSelected=JuBrain+Cytoarchitectonic+Atlas')
    await atlasPage.wait(MAT_SIDENAV_TIMEOUT)
    await atlasPage.dismissModal()

    do {

    } while(
      await atlasPage.wait(100),
      !(await atlasPage.viewerIsPopulated())
    )
  })

  it('> on init, side panel should be visible', async () => {
    const sideNavIsDisplayed = await atlasPage.sideNavIsVisible()
    expect(sideNavIsDisplayed).toEqual(true)

    const toggleTabIsDIsplayed = await atlasPage.sideNavTabIsVisible()
    expect(toggleTabIsDIsplayed).toEqual(true)
  })

  describe('> toggling', () => {
    it('> toggle tab should toggle side nav', async () => {
      const init = await atlasPage.sideNavIsVisible()
      expect(init).toEqual(true)

      await atlasPage.clickSideNavTab()
      await atlasPage.wait(MAT_SIDENAV_TIMEOUT)
      const expectHidden = await atlasPage.sideNavIsVisible()
      expect(expectHidden).toEqual(false)

      await atlasPage.clickSideNavTab()
      await atlasPage.wait(MAT_SIDENAV_TIMEOUT)
      const expectShown = await atlasPage.sideNavIsVisible()
      expect(expectShown).toEqual(true)
    })
  })
})

describe('> status panel', () => {

  let atlasPage

  beforeEach(async () => {
    atlasPage = new AtlasPage()
    await atlasPage.init()
    await atlasPage.goto('/?templateSelected=MNI+152+ICBM+2009c+Nonlinear+Asymmetric&parcellationSelected=JuBrain+Cytoarchitectonic+Atlas')
    await atlasPage.wait(MAT_SIDENAV_TIMEOUT)
    await atlasPage.dismissModal()

    do {

    } while(
      await atlasPage.wait(100),
      !(await atlasPage.viewerIsPopulated())
    )
  })

  afterEach(() => {
    atlasPage = null
  })

  it('> on init, status panel should not be visible', async () => {
    
    const init = await atlasPage.statusPanelIsVisible()
    expect(init).toEqual(false)
  })

  it('> on toggling side panel, status panel should become visible', async () => {
    await atlasPage.clickSideNavTab()
    await atlasPage.wait(MAT_SIDENAV_TIMEOUT)

    const expectVisible = await atlasPage.statusPanelIsVisible()
    expect(expectVisible).toEqual(true)
  })

  it('> on click status panel, side nav become visible, status panel become invisible', async () => {

    await atlasPage.clickSideNavTab()
    await atlasPage.wait(MAT_SIDENAV_TIMEOUT)
  
    await atlasPage.clickStatusPanel()
    await atlasPage.wait(MAT_SIDENAV_TIMEOUT)

    const expectHidden = await atlasPage.statusPanelIsVisible()
    expect(expectHidden).toEqual(false) 
    
    const expectVisible = await atlasPage.sideNavIsVisible()
    expect(expectVisible).toEqual(true)
  })
})
