const { AtlasPage } = require('../util')
const template = 'ICBM 2009c Nonlinear Asymmetric'

const pluginName = `fzj.xg.testWidget`
const pluginDisplayName = `Test Widget Title`

const prepareWidget = ({ template = 'hello world', script = `console.log('hello world')` } = {}) => {
  
  return `
const jsSrc = \`${script.replace(/\`/, '\\`')}\`
const blob = new Blob([jsSrc], { type: 'text/javascript' })
window.interactiveViewer.uiHandle.launchNewWidget({
  name: '${pluginName}',
  displayName: '${pluginDisplayName}',
  template: \`${template.replace(/\`/, '\\`')}\`,
  scriptURL: URL.createObjectURL(blob)
})`
}

describe('> plugin api', () => {
  let iavPage

  beforeEach(async () => {
    iavPage = new AtlasPage()
    await iavPage.init()
    await iavPage.goto()
    await iavPage.selectTitleCard(template)
    await iavPage.wait(500)
    await iavPage.waitUntilAllChunksLoaded()
  })

  describe('> interactiveViewer', () => {
    describe('> uiHandle', () => {
      describe('> launchNewWidget', () => {
        it('should launch new widget', async () => {

          const prevTitle = await iavPage.execScript(() => window.document.title)
          await iavPage.execScript(prepareWidget({ script: `window.document.title = 'hello world ' + window.document.title` }))

          await iavPage.wait(500)

          const isDisplayed = await iavPage.widgetPanelIsDispalyed(`Test Widget Title`)
          expect(isDisplayed).toEqual(true)

          const newTitle = await iavPage.execScript(() => window.document.title)
          expect(newTitle).toEqual(`hello world ${prevTitle}`)
        })
      })
    })
  })

  describe('> pluginControl', () => {
    describe('> onShutdown', () => {
      it('> works', async () => {
        const newTitle = `testing pluginControl onShutdown`
        const script = `window.interactiveViewer.pluginControl['${pluginName}'].onShutdown(() => window.document.title = '${newTitle}')`
        await iavPage.execScript(prepareWidget({ script }))
        await iavPage.wait(500)
        const oldTitle = await iavPage.execScript(() => window.document.title)
        await iavPage.closeWidgetByname(pluginDisplayName)
        await iavPage.wait(500)
        const actualNewTitle = await iavPage.execScript(() => window.document.title)
        expect(oldTitle).not.toEqual(actualNewTitle)
        expect(actualNewTitle).toEqual(newTitle)
      })
    })
  })
})
