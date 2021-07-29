const { AtlasPage } = require('../util')
const atlasName = 'Multilevel Human Atlas'
const template = 'ICBM 152 2009c Nonlinear Asymmetric'

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
    await iavPage.setAtlasSpecifications(atlasName)
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

      describe('> cancelPromise', () => {
        let originalTitle
        beforeEach(async () => {
          originalTitle = await iavPage.execScript(() => window.document.title)

          await iavPage.execScript(() => {
            const pr = interactiveViewer.uiHandle.getUserToSelectARegion('hello world title')
            pr
              .then(obj => window.document.title = 'success ' + obj.segment.name)
              .catch(() => window.document.title = 'failed')
            window.pr = pr
          })

          await iavPage.wait(500)

          await iavPage.execScript(() => {
            const pr = window.pr
            interactiveViewer.uiHandle.cancelPromise(pr)
          })
        })

        it('> cancelPromise rejects promise', async () => {
          const newTitle = await iavPage.execScript(() => window.document.title)
          expect(newTitle).toEqual('failed')
        })
      })

      describe('> getUserToSelectARegion', () => {
        let originalTitle
        const cursorPos = [250, 660]
        const cursorRegion = 'Area hOc1 (V1, 17, CalcS)'
        beforeEach(async () => {
          originalTitle = await iavPage.execScript(() => window.document.title)

          await iavPage.execScript(() => {
            interactiveViewer.uiHandle.getUserToSelectARegion('hello world title')
              .then(obj => window.document.title = 'success ' + obj.segment.name)
              .catch(() => window.document.title = 'failed')
          })
          
          await iavPage.wait(500)
        })

        it('> shows modal dialog', async () => {
          const text = await iavPage.getModalText()
          expect(text).toContain('hello world title')
        })

        it('> modal has cancel button', async () => {
          const texts = await iavPage.getModalActions()
          const idx = texts.findIndex(text => /cancel/i.test(text))
          expect(idx).toBeGreaterThanOrEqual(0)
        })

        it('> cancelling by esc rejects pr', async () => {
          await iavPage.clearAlerts()
          await iavPage.wait(500)
          const newTitle = await iavPage.execScript(() => window.document.title)
          expect(newTitle).toEqual('failed')
        })

        it('> cancelling by pressing cancel rejects pr', async () => {
          await iavPage.clickModalBtnByText('Cancel')
          await iavPage.wait(500)
          const newTitle = await iavPage.execScript(() => window.document.title)
          expect(newTitle).toEqual('failed')
        })

        it('> on clicking region, resolves pr', async () => {
          await iavPage.cursorMoveToAndClick({ position: cursorPos })
          await iavPage.wait(500)
          const newTitle = await iavPage.execScript(() => window.document.title)
          expect(newTitle).toEqual(`success ${cursorRegion}`)
        })

        it('> on failusre, clears modal', async () => {

          await iavPage.clearAlerts()
          await iavPage.wait(500)
          try {
            const text = await iavPage.getModalText()
            fail(`expected modal to clear, but modal has text ${text}`)
          } catch (e) {
            expect(true).toEqual(true)
          }
        })

        it('> on success, clears modal', async () => {

          await iavPage.cursorMoveToAndClick({ position: cursorPos })
          await iavPage.wait(500)
          
          try {
            const text = await iavPage.getModalText()
            fail(`expected modal to clear, but modal has text ${text}`)
          } catch (e) {
            expect(true).toEqual(true)
          }
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
