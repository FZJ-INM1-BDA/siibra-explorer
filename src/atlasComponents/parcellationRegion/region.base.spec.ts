import { TestBed } from '@angular/core/testing'
import { MockStore, provideMockStore } from '@ngrx/store/testing'
import { viewerStateSelectTemplateWithId } from 'src/services/state/viewerState/actions'
import { RegionBase, regionInOtherTemplateSelector, getRegionParentParcRefSpace } from './region.base'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const util = require('common/util')

/**
 * regions
 */

const mr0 = {
  labelIndex: 1,
  name: 'mr0',
  availableIn: [{id: 'fzj/mock/rs/v0.0.0/aaa-bbb'}, {id: 'fzj/mock/rs/v0.0.0/bbb-bbb'}, {id: 'fzj/mock/rs/v0.0.0/ccc-bbb'}],
  id: {
    kg: {
      kgSchema: 'fzj/mock/pr',
      kgId: 'aaa-bbb'
    }
  }
}

enum EnumParcRegVersion{
  V1_18 = 'V1_18',
  V2_4 = "V2_4"
}

const getRegionInOtherTemplateSelectorBundle = (version: EnumParcRegVersion) => {
  switch (version) {
    case EnumParcRegVersion.V1_18: {
      /**
       * regions
       */

      const mr1wrong = {
        labelIndex: 1,
        name: 'mr1',
        id: {
          kg: {
            kgSchema: 'fzj/mock/pr',
            kgId: 'fff-bbb'
          }
        }
      }

      const mr0wrong = {
        labelIndex: 1,
        name: 'mr0',
        id: {
          kg: {
            kgSchema: 'fzj/mock/pr',
            kgId: 'aaa-fff'
          }
        }
      }


      const mr1lh = {
        labelIndex: 1,
        name: 'mr1 left',
        id: {
          kg: {
            kgSchema: 'fzj/mock/pr',
            kgId: 'ccc-bbb'
          }
        }
      }

      const mr1rh = {
        labelIndex: 1,
        name: 'mr1 right',
        id: {
          kg: {
            kgSchema: 'fzj/mock/pr',
            kgId: 'ccc-bbb'
          }
        }
      }

      const mr0nh = {
        labelIndex: 11,
        name: 'mr0',
      }

      const mr0lh = {
        labelIndex: 1,
        name: 'mr0 left',
        availableIn: [{id: 'fzj/mock/rs/v0.0.0/aaa-bbb'}, {id: 'fzj/mock/rs/v0.0.0/bbb-bbb'}, {id: 'fzj/mock/rs/v0.0.0/ccc-bbb'}],
        id: {
          kg: {
            kgSchema: 'fzj/mock/pr',
            kgId: 'aaa-bbb'
          }
        }
      }

      const mr0rh = {
        labelIndex: 1,
        name: 'mr0 right',
        id: {
          kg: {
            kgSchema: 'fzj/mock/pr',
            kgId: 'aaa-bbb'
          }
        }
      }

      const mr1 = {
        labelIndex: 1,
        name: 'mr1',
        id: {
          kg: {
            kgSchema: 'fzj/mock/pr',
            kgId: 'ccc-bbb'
          }
        }
      }

      // parcellations

      const mp1h = {
        name: 'mp1h',
        '@id': 'parcellation/id',
        regions: [ mr0nh, mr1lh, mr0lh,  mr0rh, mr1rh ]
      }

      const mpWrong = {
        name: 'mp1h',
        '@id': 'parcellation/id',
        regions: [ mr1wrong, mr0wrong ]
      }

      const mp0 = {
        name: 'mp0',
        '@id': 'parcellation/id',
        regions: [ mr1, mr0 ]
      }

      // templates

      const mt0 = {
        name: 'mt0',
        '@id': 'fzj/mock/rs/v0.0.0/aaa-bbb',
        parcellations: [ mp0 ]
      }

      const mt1 = {
        name: 'mt1',
        '@id': 'fzj/mock/rs/v0.0.0/bbb-bbb',
        parcellations: [ mp0 ]
      }

      const mt2 = {
        name: 'mt2',
        '@id': 'fzj/mock/rs/v0.0.0/ccc-bbb',
        parcellations: [ mp1h ]
      }

      const mt3 = {
        name: 'mt3',
        '@id': 'fzj/mock/rs/v0.0.0/ddd-bbb',
        parcellations: [ mp1h ]
      }

      const mtWrong = {
        name: 'mtWrong',
        '@id': 'fzj/mock/rs/v0.0.0/ddd-bbb',
        parcellations: [ mpWrong ]
      }

      const mockFetchedTemplates = [ mt0, mt1, mt2, mt3, mtWrong ]
      return {
        mockFetchedTemplates,
        mt2,
        mt0,
        mp0,
        mt1,
        mp1h,
        mr0lh,
        mt3,
        mr0,
        mr0rh,
        mr0nh
      }

    }
    case EnumParcRegVersion.V2_4: {
      /**
       * regions
       */

      const mr1wrong = {
        labelIndex: 1,
        name: 'mr1',
        id: {
          kg: {
            kgSchema: 'fzj/mock/pr',
            kgId: 'fff-bbb'
          }
        }
      }

      const mr0wrong = {
        labelIndex: 1,
        name: 'mr0',
        id: {
          kg: {
            kgSchema: 'fzj/mock/pr',
            kgId: 'aaa-fff'
          }
        }
      }


      const mr1lh = {
        labelIndex: 1,
        name: 'mr1',
        status: 'left',
        id: {
          kg: {
            kgSchema: 'fzj/mock/pr',
            kgId: 'ccc-bbb'
          }
        }
      }

      const mr1rh = {
        labelIndex: 1,
        name: 'mr1',
        status: 'right',
        id: {
          kg: {
            kgSchema: 'fzj/mock/pr',
            kgId: 'ccc-bbb'
          }
        }
      }

      const mr0nh = {
        labelIndex: 11,
        name: 'mr0',
      }

      const mr0lh = {
        labelIndex: 1,
        name: 'mr0 left',
        availableIn: [{id: 'fzj/mock/rs/v0.0.0/aaa-bbb'}, {id: 'fzj/mock/rs/v0.0.0/bbb-bbb'}, {id: 'fzj/mock/rs/v0.0.0/ccc-bbb'}],
        id: {
          kg: {
            kgSchema: 'fzj/mock/pr',
            kgId: 'aaa-bbb'
          }
        }
      }

      const mr0rh = {
        labelIndex: 1,
        name: 'mr0 right',
        id: {
          kg: {
            kgSchema: 'fzj/mock/pr',
            kgId: 'aaa-bbb'
          }
        }
      }

      const mr1 = {
        labelIndex: 1,
        name: 'mr1',
        id: {
          kg: {
            kgSchema: 'fzj/mock/pr',
            kgId: 'ccc-bbb'
          }
        }
      }

      // parcellations

      const mp1h = {
        name: 'mp1h',
        '@id': 'parcellation/id',
        regions: [ mr0nh, mr1lh, mr0lh,  mr0rh, mr1rh ]
      }

      const mpWrong = {
        name: 'mp1h',
        '@id': 'parcellation/id',
        regions: [ mr1wrong, mr0wrong ]
      }

      const mp0 = {
        name: 'mp0',
        '@id': 'parcellation/id',
        regions: [ mr1, mr0 ]
      }

      // templates

      const mt0 = {
        name: 'mt0',
        '@id': 'fzj/mock/rs/v0.0.0/aaa-bbb',
        parcellations: [ mp0 ]
      }

      const mt1 = {
        name: 'mt1',
        '@id': 'fzj/mock/rs/v0.0.0/bbb-bbb',
        parcellations: [ mp0 ]
      }

      const mt2 = {
        name: 'mt2',
        '@id': 'fzj/mock/rs/v0.0.0/ccc-bbb',
        parcellations: [ mp1h ]
      }

      const mt3 = {
        name: 'mt3',
        '@id': 'fzj/mock/rs/v0.0.0/ddd-bbb',
        parcellations: [ mp1h ]
      }

      const mtWrong = {
        name: 'mtWrong',
        '@id': 'fzj/mock/rs/v0.0.0/ddd-bbb',
        parcellations: [ mpWrong ]
      }

      const mockFetchedTemplates = [ mt0, mt1, mt2, mt3, mtWrong ]
      return {
        mockFetchedTemplates,
        mt2,
        mt0,
        mp0,
        mt1,
        mp1h,
        mr0lh,
        mr0nh,
        mt3,
        mr0,
        mr0rh
      }
    }
    default: throw new Error(`version needs to be v1.18 or v2.4`)
  }
}

describe('> region.base.ts', () => {
  describe('> regionInOtherTemplateSelector', () => {

    // TODO
    it('> only selects region in the template specified by selected atlas')

    for (const enumKey of Object.keys(EnumParcRegVersion)) {
      describe(`> selector version for ${enumKey}`, () => {

        const { mockFetchedTemplates, mr0, mt2, mt0, mp0, mt1, mp1h, mr0lh, mt3, mr0rh, mr0nh } = getRegionInOtherTemplateSelectorBundle(enumKey as EnumParcRegVersion)

        let selectedAtlas = {
          templateSpaces: mockFetchedTemplates
        }
        describe('> no hemisphere selected, simulates big brain cyto map', () => {

          let result: any[]
          beforeAll(() => {
            result = regionInOtherTemplateSelector.projector(selectedAtlas, mockFetchedTemplates, { region: {...mr0, context: {template: mt0, parcellation: mp0} }})
          })

          it('> length checks out', () => {
            expect(result.length).toEqual(4)
          })

          it('> does not contain itself', () => {
            expect(result).not.toContain(
              jasmine.objectContaining({
                template: mt0,
                parcellation: mp0,
                region: mr0
              })
            )
          })

          it('> no hemisphere result has no hemisphere meta data', () => {
            expect(result).toContain(
              jasmine.objectContaining({
                template: mt1,
                parcellation: mp0,
                region: mr0
              })
            )
          })

          it('> hemisphere result has hemisphere metadata # 1', () => {
            expect(result).toContain(
              jasmine.objectContaining({
                template: mt2,
                parcellation: mp1h,
                region: mr0lh,
                hemisphere: 'left'
              })
            )
          })
          it('> hemisphere result has hemisphere metadata # 2', () => {
            expect(result).toContain(
              jasmine.objectContaining({
                template: mt2,
                parcellation: mp1h,
                region: mr0rh,
                hemisphere: 'right'
              })
            )
          })
        })

        describe('> hemisphere data selected (left), simulates julich-brain in mni152', () => {
          let result
          beforeAll(() => {
            result = regionInOtherTemplateSelector.projector(selectedAtlas, mockFetchedTemplates, { region: {...mr0lh, context: {template: mt0, parcellation: mp1h} }})
          })

          it('> length checks out', () => {
            expect(result.length).toEqual(3)
          })

          it('> does not select wrong hemisphere (right)', () => {
            expect(result).not.toContain(
              jasmine.objectContaining({
                template: mt2,
                parcellation: mp1h,
                region: mr0rh,
              })
            )
          })

          it('> select the region with correct hemisphere', () => {
            expect(result).toContain(
              jasmine.objectContaining({
                template: mt2,
                parcellation: mp1h,
                region: mr0lh
              })
            )
          })
        })

      })
    }

  })

  describe('> RegionBase', () => {
    let regionBase: RegionBase
    let mockStore: MockStore
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          provideMockStore()
        ]
      })
      mockStore = TestBed.inject(MockStore)
      mockStore.overrideSelector(regionInOtherTemplateSelector, [])
      mockStore.overrideSelector(getRegionParentParcRefSpace, { template: null, parcellation: null })
    })
    describe('> position', () => {
      beforeEach(() => {
        regionBase = new RegionBase(mockStore)
      })
      it('> does not populate if position property is absent', () => {
        regionBase.region = {
          ...mr0
        } as any
        expect(regionBase.position).toBeFalsy()
      })

      describe('> does not populate if position property is malformed', () => {
        it('> if region is falsy', () => {
          regionBase.region = null
          expect(regionBase.position).toBeFalsy()
        })
        it('> if props is falsy', () => {
          regionBase.region = {
            ...mr0,
            props: null
          } as any
          expect(regionBase.position).toBeFalsy()
        })
        it('> if props.components is falsy', () => {
          regionBase.region = {
            ...mr0,
            props: {
              components: null
            }
          } as any
          expect(regionBase.position).toBeFalsy()
        })
        it('> if props.components[0] is falsy', () => {
          regionBase.region = {
            ...mr0,
            props: {
              components: []
            }
          } as any
          expect(regionBase.position).toBeFalsy()
        })

        it('> if props.components[0].centroid is falsy', () => {

          regionBase.region = {
            ...mr0,
            props: {
              components: [{
                centroid: null
              }]
            }
          } as any
          expect(regionBase.position).toBeFalsy()
        })
      })

      it('> populates if position property is array with length 3 and non NaN element', () => {
        regionBase.region = {
          ...mr0,
          props: {
            components: [{
              centroid: [1, 2, 3]
            }]
          },
        } as any
        expect(regionBase.position).toBeTruthy()
      })
    })

    describe('> rgb', () => {
      let strToRgbSpy: jasmine.Spy
      let mockStore: MockStore
      beforeEach(() => {
        strToRgbSpy = spyOn(util, 'strToRgb')
        mockStore = TestBed.inject(MockStore)
        mockStore.overrideSelector(regionInOtherTemplateSelector, [])
        mockStore.overrideSelector(getRegionParentParcRefSpace, { template: null, parcellation: null })
      })

      afterEach(() => {
        strToRgbSpy.calls.reset()
      })

      it('> will take region.rgb if exists', () => {
        const regionBase = new RegionBase(mockStore)
        regionBase.region = {
          rgb: [100, 120, 140]
        } as any
        expect(
          regionBase.rgbString
        ).toEqual(`rgb(100,120,140)`)
      })

      it('> if rgb not provided, and labelIndex > 65500, set to white', () => {

        const regionBase = new RegionBase(mockStore)
        regionBase.region = {
          labelIndex: 65535
        } as any
        expect(
          regionBase.rgbString
        ).toEqual(`rgb(255,255,255)`)
      })

      describe('> if rgb not provided, labelIndex < 65500', () => {

        describe('> arguments for strToRgb', () => {
          it('> if ngId is defined, use ngId', () => {

            const regionBase = new RegionBase(mockStore)
            regionBase.region = {
              ngId: 'foo',
              name: 'bar',
              labelIndex: 152
            } as any
            expect(strToRgbSpy).toHaveBeenCalledWith(`foo152`)
          })
          it('> if ngId is not defined, use name', () => {

            const regionBase = new RegionBase(mockStore)
            regionBase.region = {
              name: 'bar',
              labelIndex: 152
            } as any
            expect(strToRgbSpy).toHaveBeenCalledWith(`bar152`)
          })
        })

        it('> calls strToRgb, and use return value for rgb', () => {
          const getRandomNum = () => Math.floor(255*Math.random())
          const arr = [
            getRandomNum(),
            getRandomNum(),
            getRandomNum()
          ]
          strToRgbSpy.and.returnValue(arr)
          const regionBase = new RegionBase(mockStore)
          regionBase.region = {
            foo: 'bar'
          } as any
          expect(
            regionBase.rgbString
          ).toEqual(`rgb(${arr.join(',')})`)
        })

        it('> if strToRgb returns falsy, uses fallback', () => {

          strToRgbSpy.and.returnValue(null)
          const regionBase = new RegionBase(mockStore)
          regionBase.region = {
            foo: 'bar'
          } as any
          expect(
            regionBase.rgbString
          ).toEqual(`rgb(255,200,200)`)
        })
      })
    })
    describe('> changeView', () => {
      const fakeTmpl = {
        '@id': 'faketmplid',
        name: 'fakeTmpl'
      }
      const fakeParc = {
        '@id': 'fakeparcid',
        name: 'fakeParc'
      }
      beforeEach(() => {
        regionBase = new RegionBase(mockStore)
      })

      describe('> [tmp] sameRegion to use transform backend', () => {
        let dispatchSpy: jasmine.Spy

        beforeEach(() => {
          dispatchSpy = spyOn(mockStore, 'dispatch')
        })
        afterEach(() => {
          dispatchSpy.calls.reset()
        })

        it('> calls viewerStateSelectTemplateWithId', () => {

          regionBase.changeView({
            template: fakeTmpl,
            parcellation: fakeParc,
          })

          expect(dispatchSpy).toHaveBeenCalledWith(
            viewerStateSelectTemplateWithId({
              payload: {
                '@id': fakeTmpl['@id']
              },
              config: {
                selectParcellation: {
                  "@id": fakeParc['@id']
                }
              }
            })
          )
        })
      })

      /**
       * currently, without position metadata, the navigation is broken
       * fix changeView to fetch position metadata. If cannot, fallback to spatial backend
       */

      // describe('> if sameRegion has position attribute', () => {
      //   let dispatchSpy: jasmine.Spy

      //   beforeEach(() => {
      //     dispatchSpy = spyOn(mockStore, 'dispatch')
      //   })
      //   afterEach(() => {
      //     dispatchSpy.calls.reset()
      //   })
      //   it('> malformed position is not an array > do not pass position', () => {

      //     regionBase.changeView({
      //       template: fakeTmpl,
      //       parcellation: fakeParc,
      //       region: {
      //         position: 'hello wolrd'
      //       }
      //     })

      //     expect(dispatchSpy).toHaveBeenCalledWith(
      //       viewerStateNewViewer({
      //         selectTemplate: fakeTmpl,
      //         selectParcellation: fakeParc,
      //         navigation: {}
      //       })
      //     )
      //   })

      //   it('> malformed position is an array of incorrect size > do not pass position', () => {

      //     regionBase.changeView({
      //       template: fakeTmpl,
      //       parcellation: fakeParc,
      //       region: {
      //         position: []
      //       }
      //     })

      //     expect(dispatchSpy).toHaveBeenCalledWith(
      //       viewerStateSelectTemplateWithId({
      //         payload: {
      //           '@id': fakeTmpl['@id']
      //         },
      //         config: {
      //           selectParcellation: {
      //             "@id": fakeParc['@id']
      //           }
      //         }
      //       })
      //     )
      //   })

      //   it('> correct position > pass position', () => {
      //     regionBase.changeView({
      //       template: fakeTmpl,
      //       parcellation: fakeParc,
      //       region: {
      //         position: [1,2,3]
      //       }
      //     })

      //     expect(dispatchSpy).toHaveBeenCalledWith(
      //       viewerStateNewViewer({
      //         selectTemplate: fakeTmpl,
      //         selectParcellation: fakeParc,
      //         navigation: {
      //           position: [1,2,3]
      //         }
      //       })
      //     )
      //   })
      // })
    })
  })
})
