const { AtlasPage } = require('../util')

describe('> scroll dataset container', () => {
  let iavPage

  beforeEach(async () => {
    iavPage = new AtlasPage()
    await iavPage.init()
  })

  it('> can scroll to the end', async () => {
    await iavPage.goto()
    await iavPage.selectTitleCard('ICBM 2009c Nonlinear Asymmetric')
    await iavPage.wait(1000)
    await iavPage.waitForAsync()

    const btnCssSelector = `[aria-label="Toggle explore panel"]`
    // const btnCssSelector = `button[mat-stroked-button].m-1.flex-grow-1.overflow-hidden`

    // TODO use .clickByCss method in future
    // TODO import aria label from common/constant.js in future
    await iavPage._browser
      .findElement( By.css(btnCssSelector) )
      .click()

    await iavPage.clearAlerts()

    const scrollContainerCssSelector = '[aria-label="List of datasets"]'
    // const scrollContainerCssSelector = 'cdk-virtual-scroll-viewport'

    let countdown = 100
    do {
      await iavPage.scrollElementBy(scrollContainerCssSelector, {
        delta: [0, 100]
      })
      await iavPage.wait(100)
      countdown --
    }while(countdown > 0)

    await iavPage.wait(500)

    const val = await iavPage.getScrollStatus(scrollContainerCssSelector)
    expect(val).toBeGreaterThanOrEqual(10000)
  })
})