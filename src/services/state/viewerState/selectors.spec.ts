import {
  viewerStateGetOverlayingAdditionalParcellations,
  viewerStateAtlasParcellationSelector,
  viewerStateAtlasLatestParcellationSelector,
  viewerStateParcVersionSelector,
} from './selectors'

const waxholmAtlasJson = require('!json-loader!src/res/ext/atlas/atlas_waxholmRat.json')
const humanAtlasJson = require('!json-loader!src/res/ext/atlas/atlas_multiLevelHuman.json')
const allenAtlasJson = require('!json-loader!src/res/ext/atlas/atlas_allenMouse.json')

const waxholmTemplates = require('!json-loader!src/res/ext/waxholmRatV2_0.json')
const allenTemplates = require('!json-loader!src/res/ext/allenMouse.json')
const colinTemplates = require('!json-loader!src/res/ext/colin.json')
const mniTemplates = require('!json-loader!src/res/ext/MNI152.json')
const bbTemplates = require('!json-loader!src/res/ext/bigbrain.json')

const fetchedAtlases = [
  waxholmAtlasJson,
  humanAtlasJson,
  allenAtlasJson,
]

const fetchedTemplates = [
  waxholmTemplates,
  allenTemplates,
  colinTemplates,
  mniTemplates,
  bbTemplates,
]

describe('viewerState/selector.ts', () => {
  describe('> viewerStateGetOverlayingAdditionalParcellations', () => {
    it('> if atlas has no basic layer, should return empty array', () => {
      const waxholmParcs = viewerStateGetOverlayingAdditionalParcellations.projector({
        fetchedAtlases,
        selectedAtlasId: waxholmAtlasJson['@id']
      }, {
        parcellationSelected: waxholmAtlasJson.parcellations[0]
      })
      
      expect(waxholmParcs).toEqual([])

      const allenParcs = viewerStateGetOverlayingAdditionalParcellations.projector({
        fetchedAtlases,
        selectedAtlasId: allenAtlasJson['@id']
      }, {
        parcellationSelected: allenAtlasJson.parcellations[0]
      })
      expect(allenParcs).toEqual([])
    })


    it('> if atlas has basic layer, should return non empty array, if non basic layer is selected', () => {
      const parc = humanAtlasJson.parcellations.find(p => !p['baseLayer'])
      const multihumanParcs = viewerStateGetOverlayingAdditionalParcellations.projector({
        fetchedAtlases,
        selectedAtlasId: humanAtlasJson['@id']
      }, {
        parcellationSelected: parc
      })
      expect(multihumanParcs.length).toEqual(1)
      expect(multihumanParcs[0]['@id']).toEqual(parc['@id'])
    })

    it('> if atlas has basic layer, but has basic layer selected, should return empty array', () => {
      const multihumanParcs = viewerStateGetOverlayingAdditionalParcellations.projector({
        fetchedAtlases,
        selectedAtlasId: humanAtlasJson['@id']
      }, {
        parcellationSelected: humanAtlasJson.parcellations[0]
      })
      expect(multihumanParcs.length).toEqual(0)
    })
  })

  describe('> viewerStateAtlasParcellationSelector', () => {
    const check = (atlasJson, templates) => {

      const parcs = viewerStateAtlasParcellationSelector.projector({
        fetchedAtlases,
        selectedAtlasId: atlasJson['@id']
      }, {
        fetchedTemplates
      })
      const templateParcs = []
      for (const tmpl of templates) {
        templateParcs.push(...tmpl.parcellations)
      }
      for (const parc of parcs) {
        const firstHalf = templateParcs.find(p => p['@id'] === parc['@id'])
        const secondHalf = atlasJson.parcellations.find(p => p['@id'] === parc['@id'])
        expect(firstHalf).toBeTruthy()
        expect(secondHalf).toBeTruthy()
        //TODO compare strict equality of firsthalf+secondhalf with parc
      }
    }
    it('> should work', () => {
      check(waxholmAtlasJson, [waxholmTemplates])
      check(allenAtlasJson, [allenTemplates])
      check(humanAtlasJson, [bbTemplates, mniTemplates, colinTemplates])
    })
  })

  describe('> viewerStateAtlasLatestParcellationSelector', () => {
    it('> for waxholm and allen, sould only show 1 parc', () => {
      const waxholmParcs = viewerStateAtlasLatestParcellationSelector.projector(waxholmAtlasJson.parcellations)
      expect(waxholmParcs.length).toEqual(1)
      const allenparcs = viewerStateAtlasLatestParcellationSelector.projector(allenAtlasJson.parcellations)
      expect(allenparcs.length).toEqual(1)
    })
  })

  describe('> viewerStateParcVersionSelector', () => {
    it('> for waxholm, should show 3 parc ordered correctly', () => {
      const parcs = viewerStateParcVersionSelector.projector(waxholmAtlasJson.parcellations, {
        parcellationSelected: waxholmAtlasJson.parcellations[0]
      })
      expect(parcs.length).toEqual(3)

      expect(parcs[0]['@version']['@next']).toBeFalsy()
      expect(parcs[parcs.length-1]['@version']['@previous']).toBeFalsy()
    })
    it('> for allen, should show 2 parc ordered correctly', () => {
      const parcs = viewerStateParcVersionSelector.projector(allenAtlasJson.parcellations, {
        parcellationSelected: allenAtlasJson.parcellations[0]
      })
      expect(parcs.length).toEqual(2)

      expect(parcs[0]['@version']['@next']).toBeFalsy()
      expect(parcs[parcs.length-1]['@version']['@previous']).toBeFalsy()
    })
  })
})