import { TestBed } from '@angular/core/testing'
import { MockStore, provideMockStore } from '@ngrx/store/testing'
import { viewerStateNewViewer } from 'src/services/state/viewerState/actions'
import { RegionBase, regionInOtherTemplateSelector, getRegionParentParcRefSpace } from './region.base'
const  util = require('common/util')

/**
 * regions
 */

const mr0 = {
  labelIndex: 1,
  name: 'mr0',
  fullId: {
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
        fullId: {
          kg: {
            kgSchema: 'fzj/mock/pr',
            kgId: 'fff-bbb'
          }
        }
      }

      const mr0wrong = {
        labelIndex: 1,
        name: 'mr0',
        fullId: {
          kg: {
            kgSchema: 'fzj/mock/pr',
            kgId: 'aaa-fff'
          }
        }
      }


      const mr1lh = {
        labelIndex: 1,
        name: 'mr1 - left hemisphere',
        fullId: {
          kg: {
            kgSchema: 'fzj/mock/pr',
            kgId: 'ccc-bbb'
          }
        }
      }

      const mr1rh = {
        labelIndex: 1,
        name: 'mr1 - right hemisphere',
        fullId: {
          kg: {
            kgSchema: 'fzj/mock/pr',
            kgId: 'ccc-bbb'
          }
        }
      }

      const mr0lh = {
        labelIndex: 1,
        name: 'mr0 - left hemisphere',
        fullId: {
          kg: {
            kgSchema: 'fzj/mock/pr',
            kgId: 'aaa-bbb'
          }
        }
      }

      const mr0rh = {
        labelIndex: 1,
        name: 'mr0 - right hemisphere',
        fullId: {
          kg: {
            kgSchema: 'fzj/mock/pr',
            kgId: 'aaa-bbb'
          }
        }
      }

      const mr1 = {
        labelIndex: 1,
        name: 'mr1',
        fullId: {
          kg: {
            kgSchema: 'fzj/mock/pr',
            kgId: 'ccc-bbb'
          }
        }
      }

      // parcellations

      const mp1h = {
        name: 'mp1h',
        regions: [ mr1lh, mr0lh,  mr0rh, mr1rh ]
      }

      const mpWrong = {
        name: 'mp1h',
        regions: [ mr1wrong, mr0wrong ]
      }

      const mp0 = {
        name: 'mp0',
        regions: [ mr1, mr0 ]
      }

      // templates

      const mt0 = {
        name: 'mt0',
        fullId: 'fzj/mock/rs/v0.0.0/aaa-bbb',
        parcellations: [ mp0 ]
      }

      const mt1 = {
        name: 'mt1',
        fullId: 'fzj/mock/rs/v0.0.0/bbb-bbb',
        parcellations: [ mp0 ]
      }

      const mt2 = {
        name: 'mt2',
        fullId: 'fzj/mock/rs/v0.0.0/ccc-bbb',
        parcellations: [ mp1h ]
      }

      const mt3 = {
        name: 'mt3',
        fullId: 'fzj/mock/rs/v0.0.0/ddd-bbb',
        parcellations: [ mp1h ]
      }

      const mtWrong = {
        name: 'mtWrong',
        fullId: 'fzj/mock/rs/v0.0.0/ddd-bbb',
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
        mr0rh
      }

    }
    case EnumParcRegVersion.V2_4: {
      /**
       * regions
       */

      const mr1wrong = {
        labelIndex: 1,
        name: 'mr1',
        fullId: {
          kg: {
            kgSchema: 'fzj/mock/pr',
            kgId: 'fff-bbb'
          }
        }
      }

      const mr0wrong = {
        labelIndex: 1,
        name: 'mr0',
        fullId: {
          kg: {
            kgSchema: 'fzj/mock/pr',
            kgId: 'aaa-fff'
          }
        }
      }


      const mr1lh = {
        labelIndex: 1,
        name: 'mr1',
        status: 'left hemisphere',
        fullId: {
          kg: {
            kgSchema: 'fzj/mock/pr',
            kgId: 'ccc-bbb'
          }
        }
      }

      const mr1rh = {
        labelIndex: 1,
        name: 'mr1',
        status: 'right hemisphere',
        fullId: {
          kg: {
            kgSchema: 'fzj/mock/pr',
            kgId: 'ccc-bbb'
          }
        }
      }

      const mr0lh = {
        labelIndex: 1,
        name: 'mr0',
        status: 'left hemisphere',
        fullId: {
          kg: {
            kgSchema: 'fzj/mock/pr',
            kgId: 'aaa-bbb'
          }
        }
      }

      const mr0rh = {
        labelIndex: 1,
        name: 'mr0',
        status: 'right hemisphere',
        fullId: {
          kg: {
            kgSchema: 'fzj/mock/pr',
            kgId: 'aaa-bbb'
          }
        }
      }

      const mr1 = {
        labelIndex: 1,
        name: 'mr1',
        fullId: {
          kg: {
            kgSchema: 'fzj/mock/pr',
            kgId: 'ccc-bbb'
          }
        }
      }

      // parcellations

      const mp1h = {
        name: 'mp1h',
        regions: [ mr1lh, mr0lh,  mr0rh, mr1rh ]
      }

      const mpWrong = {
        name: 'mp1h',
        regions: [ mr1wrong, mr0wrong ]
      }

      const mp0 = {
        name: 'mp0',
        regions: [ mr1, mr0 ]
      }

      // templates

      const mt0 = {
        name: 'mt0',
        fullId: 'fzj/mock/rs/v0.0.0/aaa-bbb',
        parcellations: [ mp0 ]
      }

      const mt1 = {
        name: 'mt1',
        fullId: 'fzj/mock/rs/v0.0.0/bbb-bbb',
        parcellations: [ mp0 ]
      }

      const mt2 = {
        name: 'mt2',
        fullId: 'fzj/mock/rs/v0.0.0/ccc-bbb',
        parcellations: [ mp1h ]
      }

      const mt3 = {
        name: 'mt3',
        fullId: 'fzj/mock/rs/v0.0.0/ddd-bbb',
        parcellations: [ mp1h ]
      }

      const mtWrong = {
        name: 'mtWrong',
        fullId: 'fzj/mock/rs/v0.0.0/ddd-bbb',
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

        const { mockFetchedTemplates, mr0, mt2, mt0, mp0, mt1, mp1h, mr0lh, mt3, mr0rh } = getRegionInOtherTemplateSelectorBundle(enumKey as EnumParcRegVersion)

        let selectedAtlas = {
          templateSpaces: mockFetchedTemplates
        }
        describe('> no hemisphere selected, simulates big brain cyto map', () => {
  
          let result: any[]
          beforeAll(() => {
            result = regionInOtherTemplateSelector.projector(selectedAtlas, mockFetchedTemplates, mt0, { region: mr0 })
          })
    
          it('> length checks out', () => {
            expect(result.length).toEqual(5)
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
                hemisphere: 'left hemisphere'
              })
            )
          })
          it('> hemisphere result has hemisphere metadata # 2', () => {
            expect(result).toContain(
              jasmine.objectContaining({
                template: mt3,
                parcellation: mp1h,
                region: mr0lh,
                hemisphere: 'left hemisphere'
              })
            )
          })
          it('> hemisphere result has hemisphere metadata # 3', () => {
            expect(result).toContain(
              jasmine.objectContaining({
                template: mt3,
                parcellation: mp1h,
                region: mr0rh,
                hemisphere: 'right hemisphere'
              })
            )
          })
          it('> hemisphere result has hemisphere metadata # 4', () => {
            expect(result).toContain(
              jasmine.objectContaining({
                template: mt3,
                parcellation: mp1h,
                region: mr0rh,
                hemisphere: 'right hemisphere'
              })
            )
          })
        })
    
        describe('> hemisphere data selected (left hemisphere), simulates julich-brain in mni152', () => {
          let result
          beforeAll(() => {
            result = regionInOtherTemplateSelector.projector(selectedAtlas, mockFetchedTemplates, mt2, { region: mr0lh })
          })
    
          it('> length checks out', () => {
            expect(result.length).toEqual(3)
          })
    
          it('> does not select wrong hemisphere (right hemisphere)', () => {
            expect(result).not.toContain(
              jasmine.objectContaining({
                template: mt3,
                parcellation: mp1h,
                region: mr0rh,
              })
            )
          })
    
          it('> select the corresponding hemisphere (left hemisphere), but without hemisphere metadata', () => {
            expect(result).toContain(
              jasmine.objectContaining({
                template: mt3,
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
        }
        expect(regionBase.position).toBeFalsy()
      })

      describe('> does not populate if position property is malformed', () => {

        it('> if position property is string', () => {
          regionBase.region = {
            ...mr0,
            position: 'hello world'
          }
          expect(regionBase.position).toBeFalsy()
        })
        it('> if position property is object', () => {
          regionBase.region = {
            ...mr0,
            position: {
              x: 0,
              y: 0,
              z: 0
            }
          }
          expect(regionBase.position).toBeFalsy()
        })

        it('> if position property is array of incorrect length', () => {
          regionBase.region = {
            ...mr0,
            position: []
          }
          expect(regionBase.position).toBeFalsy()
        })

        it('> if position property is array contain non number elements', () => {
          regionBase.region = {
            ...mr0,
            position: [1, 2, 'hello world']
          }
          expect(regionBase.position).toBeFalsy()
        })


        it('> if position property is array contain NaN', () => {
          regionBase.region = {
            ...mr0,
            position: [1, 2, NaN]
          }
          expect(regionBase.position).toBeFalsy()
        })
      })
    
      it('> populates if position property is array with length 3 and non NaN element', () => {
        regionBase.region = {
          ...mr0,
          position: [1, 2, 3]
        }
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
        }
        expect(
          regionBase.rgbString
        ).toEqual(`rgb(100,120,140)`)
      })

      it('> if rgb not provided, and labelIndex > 65500, set to white', () => {

        const regionBase = new RegionBase(mockStore)
        regionBase.region = {
          labelIndex: 65535
        }
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
            }
            expect(strToRgbSpy).toHaveBeenCalledWith(`foo152`)
          })
          it('> if ngId is not defined, use name', () => {

            const regionBase = new RegionBase(mockStore)
            regionBase.region = {
              name: 'bar',
              labelIndex: 152
            }
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
          }
          expect(
            regionBase.rgbString
          ).toEqual(`rgb(${arr.join(',')})`)
        })

        it('> if strToRgb returns falsy, uses fallback', () => {

          strToRgbSpy.and.returnValue(null)
          const regionBase = new RegionBase(mockStore)
          regionBase.region = {
            foo: 'bar'
          }
          expect(
            regionBase.rgbString
          ).toEqual(`rgb(255,200,200)`)
        })
      })
    })
    describe('> changeView', () => {
      const fakeTmpl = {
        name: 'fakeTmpl'
      }
      const fakeParc = {
        name: 'fakeParc'
      }
      beforeEach(() => {
        regionBase = new RegionBase(mockStore)
      })

      describe('> if sameRegion has position attribute', () => {
        let dispatchSpy: jasmine.Spy

        beforeEach(() => {
          dispatchSpy = spyOn(mockStore, 'dispatch')
        })
        afterEach(() => {
          dispatchSpy.calls.reset()
        })
        it('> malformed position is not an array > do not pass position', () => {

          regionBase.changeView({
            template: fakeTmpl,
            parcellation: fakeParc,
            region: {
              position: 'hello wolrd'
            }
          })

          expect(dispatchSpy).toHaveBeenCalledWith(
            viewerStateNewViewer({
              selectTemplate: fakeTmpl,
              selectParcellation: fakeParc,
              navigation: {}
            })
          )
        })

        it('> malformed position is an array of incorrect size > do not pass position', () => {

          regionBase.changeView({
            template: fakeTmpl,
            parcellation: fakeParc,
            region: {
              position: []
            }
          })

          expect(dispatchSpy).toHaveBeenCalledWith(
            viewerStateNewViewer({
              selectTemplate: fakeTmpl,
              selectParcellation: fakeParc,
              navigation: {}
            })
          )
        })

        it('> correct position > pass position', () => {
          regionBase.changeView({
            template: fakeTmpl,
            parcellation: fakeParc,
            region: {
              position: [1,2,3]
            }
          })

          expect(dispatchSpy).toHaveBeenCalledWith(
            viewerStateNewViewer({
              selectTemplate: fakeTmpl,
              selectParcellation: fakeParc,
              navigation: {
                position: [1,2,3]
              }
            })
          )
        })
      })
    })
  })
})
