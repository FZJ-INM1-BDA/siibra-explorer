const { AtlasPage } = require('../util')
const { ARIA_LABELS } = require('../../../common/constants')
const fs = require('fs')
const path = require('path')

const outputDir = path.join(__dirname, '../../../docs/autogen_images')
const exists = fs.existsSync(outputDir)
if (!exists) fs.mkdirSync(outputDir)

describe('> share', () => {
  let iavPage
  beforeEach(async () => {
    iavPage = new AtlasPage()
    await iavPage.init()
    await iavPage.goto()
    await iavPage.selectTitleCard('Big Brain (Histology)')
    await iavPage.wait(1000)
    await iavPage.waitUntilAllChunksLoaded()
  })

  it('> generating highlight share btn', async () => {
    const b64 = await iavPage.takeScreenshot(`[aria-label="${ARIA_LABELS.SHARE_BTN}"]`)

    const outputPath = path.join(outputDir, 'share_highlightShareBtn.png')
    fs.writeFileSync(outputPath, b64, 'base64')
  })

  it('> generating highlight shareUrl btn', async () => {
    await iavPage.click(`[aria-label="${ARIA_LABELS.SHARE_BTN}"]`)
    await iavPage.wait(1000)

    const b64 = await iavPage.takeScreenshot(`[aria-label="${ARIA_LABELS.SHARE_COPY_URL_CLIPBOARD}"]`)

    const outputPath = path.join(outputDir, 'share_highlightShareURL.png')
    fs.writeFileSync(outputPath, b64, 'base64')
  })

  it('> generating highlight custom URL', async () => {

    await iavPage.click(`[aria-label="${ARIA_LABELS.SHARE_BTN}"]`)
    await iavPage.wait(1000)

    const b64 = await iavPage.takeScreenshot(`[aria-label="${ARIA_LABELS.SHARE_CUSTOM_URL}"]`)

    const outputPath = path.join(outputDir, 'share_highlightShareCustomURL.png')
    fs.writeFileSync(outputPath, b64, 'base64')
  })

  it('> generating custom URL dialog', async () => {

    await iavPage.click(`[aria-label="${ARIA_LABELS.SHARE_BTN}"]`)
    await iavPage.wait(1000)
    await iavPage.click(`[aria-label="${ARIA_LABELS.SHARE_CUSTOM_URL}"]`)
    await iavPage.wait(1000)

    const b64 = await iavPage.takeScreenshot(`[aria-label="${ARIA_LABELS.SHARE_CUSTOM_URL_DIALOG}"]`)

    const outputPath = path.join(outputDir, 'share_shareCustomURLDialog.png')
    fs.writeFileSync(outputPath, b64, 'base64')
  })
})
