const { AtlasPage } = require('../util')

const dictionary = {
  "Allen Mouse Common Coordinate Framework v3": {
    "Allen Mouse Common Coordinate Framework v3 2017": {
      tests: [
        {
          position: [530, 530],
          expectedLabelName: 'Primary somatosensory area, barrel field, layer 4',
        },
        {
          position: [590, 120],
          expectedLabelName: 'Retrosplenial area, ventral part, layer 2/3',
        }
      ]
    },
    "Allen Mouse Common Coordinate Framework v3 2015": {
      tests: [
        {
          position: [520, 530],
          expectedLabelName: 'Primary somatosensory area, barrel field',
        },
        {
          position: [588, 115],
          expectedLabelName: 'Retrosplenial area, ventral part',
        }
      ]
    }
  },
  "Waxholm Space rat brain MRI/DTI": {
    "Waxholm Space rat brain atlas v3": {
      tests: [
        {
          position: [350, 170],
          expectedLabelName: 'neocortex',
        },
        {
          position: [320, 560],
          expectedLabelName: 'corpus callosum and associated subcortical white matter',
        }
      ]
    },
    "Waxholm Space rat brain atlas v2": {
      tests: [
        {
          position: [500, 630],
          expectedLabelName: 'lateral entorhinal cortex',
        },
        {
          position: [300, 200],
          expectedLabelName: 'dentate gyrus',
        }
      ]
    },
    "Waxholm Space rat brain atlas v1": {
      tests: [
        {
          position: [480, 680],
          expectedLabelName: 'inner ear',
        },
        {
          position: [550, 550],
          expectedLabelName: 'corpus callosum and associated subcortical white matter',
        }
      ]
    }
  },
  "ICBM 2009c Nonlinear Asymmetric": {
    "JuBrain Cytoarchitectonic Atlas": {
      tests:[
        {
          position: [550, 270],
          expectedLabelName: 'Fastigial Nucleus (Cerebellum) - right hemisphere',
        },
        {
          position: [600, 490],
          expectedLabelName: 'Area 6ma (preSMA, mesial SFG) - left hemisphere',
        }
      ]
    },
    "Fibre Bundle Atlas - Long Bundle": {
      tests: [
        {
          position: [300, 210],
          expectedLabelName: 'InferiorFrontoOccipital - Right',
        },
        {
          position: [680, 590],
          expectedLabelName: 'InferiorLongitudinal - Left',
        }
      ]
    },
    "Fibre Bundle Atlas - Short Bundle": {
      tests: [
        {
          position: [300, 100],
          expectedLabelName: 'rh_SP-SM_0',
        },
        {
          position: [642, 541],
          expectedLabelName: 'lh_CAC-PrCu_0',
        }
      ]
    }
  },
  // TODO big brain cytomap occassionally resets center position to -20mm. investigate why
  "Big Brain (Histology)": {
    "Cytoarchitectonic Maps": {
      url: "/?templateSelected=Big+Brain+%28Histology%29&parcellationSelected=Cytoarchitectonic+Maps&cNavigation=0.0.0.-W000.._eCwg.2-FUe3._-s_W.2_evlu..7LIx..1n5q~.1FYC.2Is-..1B9C",
      tests: [
        {
          position: [686, 677],
          expectedLabelName: 'Area STS1 (STS)'
        },
        {
          position: [617,682],
          expectedLabelName: 'Entorhinal Cortex'
        }
      ]
    },
    "BigBrain Cortical Layers Segmentation": {
      url: "/?templateSelected=Big+Brain+%28Histology%29&parcellationSelected=BigBrain+Cortical+Layers+Segmentation&cNavigation=0.0.0.-W000.._eCwg.2-FUe3._-s_W.2_evlu..7LIx..2c8U8.1FYC.wfmi..91G",
      tests: [
        {
          position: [330, 550],
          expectedLabelName: 'cortical layer 6',
        },
        {
          position: [475, 244],
          expectedLabelName: 'cortical layer 1',
        }
      ]
    },
    "Grey/White matter": {
      url: "/?templateSelected=Big+Brain+%28Histology%29&parcellationSelected=Grey%2FWhite+matter&cNavigation=0.0.0.-W000.._eCwg.2-FUe3._-s_W.2_evlu..7LIx..3cX1m.1FYC.Cr8t..5Jn",
      tests: [
        {
          position: [210, 238],
          expectedLabelName: 'White matter'
        },
        {
          position: [600, 150],
          expectedLabelName: 'Grey matter'
        }
      ]
    }
  }
}

describe('> mouse over viewer show area name', () => {
  let iavPage
  beforeAll(async () => {
    iavPage = new AtlasPage()
    await iavPage.init()
  })

  for (const templateName in dictionary) {
    for (const parcellationName in dictionary[templateName]) {
      describe(`> testing template: ${templateName} & parcellation: ${parcellationName}`, () => {

        const {url, tests} = dictionary[templateName][parcellationName]
        beforeAll(async () => {
          if (url) {
            await iavPage.goto(url)
          } else {
            await iavPage.goto()
            await iavPage.selectTitleTemplateParcellation(templateName, parcellationName)
          }
          
          const tag = await iavPage.getSideNavTag()
          await tag.click()
          await iavPage.wait(1000)
          await iavPage.waitUntilAllChunksLoaded()
        })
        for (const { position, expectedLabelName } of tests ) {          
          it(`> at cursor position: ${JSON.stringify(position)}, expect label name: ${expectedLabelName}`, async () => {

            await iavPage.cursorMoveTo({ position })
            await iavPage.wait(2000)
            const text = await iavPage.getFloatingCtxInfoAsText()
            expect(
              text.indexOf(expectedLabelName)
            ).toBeGreaterThanOrEqual(0)
          })
        }
      })
    }
  }
})
