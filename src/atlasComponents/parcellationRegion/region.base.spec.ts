import { TestBed } from '@angular/core/testing'
import { MockStore, provideMockStore } from '@ngrx/store/testing'
import { viewerStateSelectTemplateWithId } from 'src/services/state/viewerState/actions'
import { RegionBase, getRegionParentParcRefSpace } from './region.base'
import { TSiibraExRegion } from './type'

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

describe('> region.base.ts', () => {
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

          const partialRegion = {
            context: {
              parcellation: fakeParc,
              atlas: {
                "@id": '',
                name: '',
                parcellations: [],
                templateSpaces: [fakeTmpl]
              },
              template: null
            }
          } as Partial<TSiibraExRegion>
          regionBase.region = partialRegion as any
          regionBase.changeView(fakeTmpl)

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
