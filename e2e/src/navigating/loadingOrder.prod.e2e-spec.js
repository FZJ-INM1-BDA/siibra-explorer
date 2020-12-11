const { AtlasPage } = require('../util')
const { IDS } = require('../../../common/constants')
const { width, height } = require('../../opts')
const { hrtime } = process

const templates = [
  ["Big Brain (Histology)", "Cytoarchitectonic Maps"],
  ["Waxholm Space rat brain MRI/DTI", "Waxholm Space rat brain atlas v3"]
]

describe('> when loading an atlas', () => {
  let iavPage = new AtlasPage()

  const getNumOfSpinners = async () => {

    try {
      return await iavPage.execScript(`
        const els = document.querySelectorAll('.spinnerAnimationCircle')
        return els && els.length
        `)
    } catch (e) {
      return false
    }
  }

  const checkRoleStatus = async () => {
    try {
      const text = await iavPage.execScript(`
        const el = document.getElementById('${IDS.MESH_LOADING_STATUS}')
        return el && el.textContent
        `)
      return text && /Loading\s.*?chunks/.test(text)
    } catch (e) {
      return false
    }
  }

  beforeEach(async () => {
    iavPage = new AtlasPage()
    await iavPage.init()
    await iavPage.goto()
  })

  for (const [template, parcelation] of templates) {

    const masterTimer = {moving: null, nonmoving: null}

    it(`> for ${template}, image will be loaded first`, async () => {
      const timer = hrtime()
      await iavPage.selectTitleTemplateParcellation(template, parcelation)
      await iavPage.wait(500)
      const preSpinners = await getNumOfSpinners()
      expect(preSpinners).toBe(4)
      while( await checkRoleStatus() ) {
        await iavPage.wait(200)
      }

      const finishedTimer = hrtime(timer)

      const postSpinners = await getNumOfSpinners()
      /**
       * There is currently a known bug that spinner in IDS.MESH_LOADING_STATUS is hidden with opacity 0 rather than unload from DOM
       * TODO fix bug
       */
      expect(postSpinners).toBeLessThanOrEqual(2)
      expect(postSpinners).toBeGreaterThanOrEqual(1)
      
      const sec = finishedTimer[0] + finishedTimer[1] / 1e9
      masterTimer.nonmoving = sec
    })

    it('> if user was panning, it should take longer as loading takes priority', async () => {
      const timer = hrtime()
      await iavPage.selectTitleTemplateParcellation(template, parcelation)
      await iavPage.wait(500)
      
      await iavPage.cursorMoveToAndDrag({
        position: [ Math.round(width / 4 * 3), Math.round(height / 4) ],
        delta: [ Math.round(width / 8), Math.round(height / 8)]
      })

      await iavPage.wait(500)

      await iavPage.cursorMoveToAndDrag({
        position: [ Math.round(width / 4 * 3), Math.round(height / 4) ],
        delta: [ 1, Math.round(height / -4)]
      })

      while( await checkRoleStatus() ) {
        await iavPage.wait(200)
      }

      const finishedTimer = hrtime(timer)
      
      const sec = finishedTimer[0] + finishedTimer[1] / 1e9
      masterTimer.moving = sec

      expect(masterTimer.moving).toBeGreaterThan(masterTimer.nonmoving)
    })

    it('> if the meshes are already loading, do not show overlay', async () => {
      
      await iavPage.selectTitleTemplateParcellation(template, parcelation)
      await iavPage.wait(500)
      
      while( await checkRoleStatus() ) {
        await iavPage.wait(200)
      }

      await iavPage.cursorMoveToAndDrag({
        position: [ Math.round(width / 4 * 3), Math.round(height / 4) ],
        delta: [ Math.round(width / 8), Math.round(height / 8)]
      })

      const roleStatus = await checkRoleStatus()

      expect(roleStatus).toBeFalsy()
    })
  }
})
