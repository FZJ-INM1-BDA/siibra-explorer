import {
  viewerStateGetOverlayingAdditionalParcellations,
  viewerStateAtlasParcellationSelector,
  viewerStateAtlasLatestParcellationSelector,
  viewerStateParcVersionSelector,
  selectorSelectedATP,
  viewerStateGetSelectedAtlas,
  viewerStateSelectedTemplateSelector,
  viewerStateSelectedParcellationSelector,
} from './selectors'


const atlas1 = {
  '@id': 'atlas-1',
  name: 'atlas-1-name',
  templateSpaces: [
    {
      '@id': 'atlas-1-tmpl-1',
      name: 'atlas-1-tmpl-1',
      availableIn: [
        {
          '@id': 'atlas-1-parc-1',
          name: 'atlas-1-parc-1'
        },
        {
          '@id': 'atlas-1-parc-2',
          name: 'atlas-1-parc-2'
        }
      ]
    }
  ],
  parcellations: [
    {
      '@id': 'atlas-1-parc-1',
      name: 'atlas-1-parc-1',
      baseLayer: true
    },
    {
      '@id': 'atlas-1-parc-2',
      name: 'atlas-1-parc-2'
    }
  ]
}

const tmpl1 = {
  '@id': 'atlas-1-tmpl-1',
  name: 'atlas-1-tmpl-1',
  parcellations: [
    {
      '@id': 'atlas-1-parc-1',
      name: 'atlas-1-parc-1'
    },
    {
      '@id': 'atlas-1-parc-2',
      name: 'atlas-1-parc-2'
    }
  ]
}

const atlas2 = {
  '@id': 'atlas-2',
  name: 'atlas-2-name',
  templateSpaces: [
    {
      '@id': 'atlas-2-tmpl-1',
      name: 'atlas-2-tmpl-1',
      availableIn: [
        {
          '@id': 'atlas-2-parc-1',
          name: 'atlas-2-parc-1'
        },
        {
          '@id': 'atlas-2-parc-2',
          name: 'atlas-2-parc-2'
        }
      ]
    },
    {
      '@id': 'atlas-2-tmpl-2',
      name: 'atlas-2-tmpl-2',
      availableIn: [
        {
          '@id': 'atlas-2-parc-1',
          name: 'atlas-2-parc-1'
        },
        {
          '@id': 'atlas-2-parc-2',
          name: 'atlas-2-parc-2'
        }
      ]
    }
  ],
  parcellations: [
    {
      '@id': 'atlas-2-parc-1',
      name: 'atlas-2-parc-1',
      "@version": {
        "@next": "atlas-2-parc-2",
        "@this": "atlas-2-parc-1",
        "name": "atlas-2-parc-1",
        "@previous": null
      }
    },
    {
      '@id': 'atlas-2-parc-2',
      name: 'atlas-2-parc-2',
      "@version": {
        "@next": null,
        "@this": "atlas-2-parc-2",
        "name": "atlas-2-parc-2",
        "@previous": "atlas-2-parc-1"
      }
    }
  ]
}

const tmpl2 = {
  '@id': 'atlas-2-tmpl-1',
  name: 'atlas-2-tmpl-1',
  parcellations: [
    {
      '@id': 'atlas-2-parc-1',
      name: 'atlas-2-parc-1'
    },
    {
      '@id': 'atlas-2-parc-2',
      name: 'atlas-2-parc-2'
    }
  ]
}


const tmpl2_2 = {
  '@id': 'atlas-2-tmpl-2',
  name: 'atlas-2-tmpl-2',
  parcellations: [
    {
      '@id': 'atlas-2-parc-1',
      name: 'atlas-2-parc-1'
    },
    {
      '@id': 'atlas-2-parc-2',
      name: 'atlas-2-parc-2'
    }
  ]
}

const fetchedAtlases = [
  atlas1,
  atlas2
]

const fetchedTemplates = [
  tmpl1,
  tmpl2,
  tmpl2_2
]

describe('viewerState/selector.ts', () => {
  // describe('> viewerStateGetOverlayingAdditionalParcellations', () => {
  //   describe('> if atlas has no basic layer', () => {
  //     it('> should return empty array', () => {

  //       const parcs = viewerStateGetOverlayingAdditionalParcellations.projector({
  //         fetchedAtlases,
  //         selectedAtlasId: atlas2['@id']
  //       }, {
  //         parcellationSelected: tmpl2.parcellations[0]
  //       })
        
  //       expect(parcs).toEqual([])
  //     })
  //   })

  //   describe('> if atlas has basic layer', () => {
  //     describe('> if non basiclayer is selected', () => {
  //       it('> should return non empty array', () => {
  //         const parc = atlas1.parcellations.find(p => !p['baseLayer'])
  //         const parcs = viewerStateGetOverlayingAdditionalParcellations.projector({
  //           fetchedAtlases,
  //           selectedAtlasId: atlas1['@id']
  //         }, {
  //           parcellationSelected: parc
  //         })
  //         expect(parcs.length).toEqual(1)
  //         expect(parcs[0]['@id']).toEqual(parc['@id'])
  //       })
  //     })

  //     describe('> if basic layer is selected', () => {
  //       it('> should return empty array', () => {
  //         const parc = atlas1.parcellations.find(p => !!p['baseLayer'])
  //         const parcs = viewerStateGetOverlayingAdditionalParcellations.projector({
  //           fetchedAtlases,
  //           selectedAtlasId: atlas1['@id']
  //         }, {
  //           parcellationSelected: parc
  //         })
  //         expect(parcs.length).toEqual(0)
  //       })
  //     })
  //   })
  // })

  // describe('> viewerStateAtlasParcellationSelector', () => {
  //   const check = (atlasJson, templates) => {

  //     const parcs = viewerStateAtlasParcellationSelector.projector({
  //       fetchedAtlases,
  //       selectedAtlasId: atlasJson['@id']
  //     }, {
  //       fetchedTemplates
  //     })
  //     const templateParcs = []
  //     for (const tmpl of templates) {
  //       templateParcs.push(...tmpl.parcellations)
  //     }
  //     for (const parc of parcs) {
  //       const firstHalf = templateParcs.find(p => p['@id'] === parc['@id'])
  //       const secondHalf = atlasJson.parcellations.find(p => p['@id'] === parc['@id'])
  //       expect(firstHalf).toBeTruthy()
  //       expect(secondHalf).toBeTruthy()
  //       //TODO compare strict equality of firsthalf+secondhalf with parc
  //     }
  //   }

  //   it('> should work', () => {
  //     check(atlas1, [tmpl1, tmpl2, tmpl2_2])
  //     check(atlas2, [tmpl1, tmpl2, tmpl2_2])
  //   })
  // })

  // describe('> viewerStateAtlasLatestParcellationSelector', () => {
  //   it('> should only show 1 parc', () => {
  //     const parcs = viewerStateAtlasLatestParcellationSelector.projector(atlas2.parcellations)
  //     expect(parcs.length).toEqual(1)
  //   })
  // })

  // describe('> viewerStateParcVersionSelector', () => {
  //   it('> should work', () => {
  //     const parcs = viewerStateParcVersionSelector.projector(atlas2.parcellations, {
  //       parcellationSelected: atlas2.parcellations[0]
  //     })
  //     expect(parcs.length).toEqual(2)

  //     expect(parcs[0]['@version']['@next']).toBeFalsy()
  //     expect(parcs[parcs.length-1]['@version']['@previous']).toBeFalsy()
  //   })
  // })

  describe("> viewerStateGetSelectedAtlas", () => {
    it("> projects properly", () => {
      const atlas1 = {
        "@id": "atlas1"
      }
      const atlas2 = {
        "@id": "atlas2"
      }
      const atlas3 = {
        "@id": "atlas3"
      }
      const allAtlases = [ atlas1, atlas2, atlas3 ]
      const result = viewerStateGetSelectedAtlas.projector({
        fetchedAtlases: allAtlases,
        overlayingAdditionalParcellations: [],
        selectedAtlasId: atlas1["@id"]
      })
      expect(result).toEqual(atlas1 as any)
    })
  })

  describe("> selectorSelectedATP", () => {
    const mockAtlas = {
      "@id": "mock atlas"
    } as any
    const mockTmpl = {
      "@id": "mock Tmpl"
    } as any
    const mockParc = {
      "@id": "mock Parc"
    } as any

    it("> transforms the selectors properly", () => {
      const result = selectorSelectedATP.projector(mockAtlas,mockTmpl,mockParc)
      expect(result).toEqual({ atlas: mockAtlas, template: mockTmpl, parcellation: mockParc })
    })
  })
})