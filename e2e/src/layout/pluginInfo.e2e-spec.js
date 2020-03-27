const { LayoutPage } = require("../util")

describe('> plugin dropdown', () => {
  let layoutPage

  beforeEach(async () => {
    layoutPage = new LayoutPage()
    await layoutPage.init()
    await layoutPage.goto()
    await layoutPage.dismissModal()
  })

  it('> click on drop down btn shows drop down menu', async () => {
    await layoutPage.showToolsMenu()
    await layoutPage.wait(500)
    const tools = await layoutPage.getVisibleTools()
    expect(tools.length).toBeGreaterThan(0)
  })

  it('> click on info btn shows info', async () => {
    await layoutPage.showToolsMenu()
    await layoutPage.wait(500)
    const tools = await layoutPage.getVisibleTools()
    const exampleIndex = tools.findIndex(tool => /Example\ Plugin/.test(tool))
    expect(exampleIndex).toBeGreaterThanOrEqual(0)
    await layoutPage.clickOnNthTool(exampleIndex, '[aria-label="About this plugin"]')
    await layoutPage.wait(500)
    const txt = await layoutPage.getModalText()
    expect(txt).toContain('About Example Plugin (v0.0.1)')
    expect(txt).toContain('description of example plugin')
    expect(txt).toContain('http://HOSTNAME/home.html')
    expect(txt).toContain('Xiaoyun Gui <x.gui@fz-juelich.de>')
    
  })
})
