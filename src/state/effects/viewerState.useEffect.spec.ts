import { cvtNavigationObjToNehubaConfig, cvtNehubaConfigToNavigationObj, ViewerStateControllerUseEffect, defaultNavigationObject, defaultNehubaConfigObject } from './viewerState.useEffect'
import { Observable, of } from 'rxjs'
import { TestBed, async } from '@angular/core/testing'
import { provideMockActions } from '@ngrx/effects/testing'
import { MockStore, provideMockStore } from '@ngrx/store/testing'
import { defaultRootState, generalActionError } from 'src/services/stateStore.service'
import { Injectable } from '@angular/core'
import { TemplateCoordinatesTransformation, ITemplateCoordXformResp } from 'src/services/templateCoordinatesTransformation.service'
import { hot } from 'jasmine-marbles'
import { AngularMaterialModule } from 'src/ui/sharedModules/angularMaterial.module'
import { HttpClientModule } from '@angular/common/http'
import { WidgetModule } from 'src/widget'
import { PluginModule } from 'src/plugin'
import { viewerStateFetchedTemplatesSelector, viewerStateNavigateToRegion, viewerStateNavigationStateSelector, viewerStateNewViewer, viewerStateSelectAtlas, viewerStateSelectTemplateWithName } from 'src/services/state/viewerState.store.helper'
import { viewerStateFetchedAtlasesSelector } from 'src/services/state/viewerState/selectors'
import { CONST } from 'common/constants'
import { PureContantService } from 'src/util'

const bigbrainJson = require('!json-loader!src/res/ext/bigbrain.json')
const bigBrainNehubaConfig = require('!json-loader!src/res/ext/bigbrainNehubaConfig.json')
const colinJson = require('!json-loader!src/res/ext/colin.json')
const colinJsonNehubaConfig = require('!json-loader!src/res/ext/colinNehubaConfig.json')
const reconstitutedColin = JSON.parse(JSON.stringify(
  {
    ...colinJson,
    nehubaConfig: colinJsonNehubaConfig
  }
))
const reconstitutedBigBrain = JSON.parse(JSON.stringify(
  {
    ...bigbrainJson,
    nehubaConfig: bigBrainNehubaConfig
  }
))
let returnPosition = null
@Injectable()
class MockCoordXformService{
  getPointCoordinatesForTemplate(src:string, tgt: string, pos: [number, number, number]): Observable<ITemplateCoordXformResp>{
    return returnPosition
      ? of({ status: 'completed', result: returnPosition } as ITemplateCoordXformResp)
      : of({ status: 'error', statusText: 'Failing query' } as ITemplateCoordXformResp)
  }
}

const initialState = JSON.parse(JSON.stringify( defaultRootState ))
initialState.viewerState.fetchedTemplates = [
  reconstitutedBigBrain,
  reconstitutedColin
]
initialState.viewerState.templateSelected = initialState.viewerState.fetchedTemplates[0]
const currentNavigation = {
  position: [4, 5, 6],
  orientation: [0, 0, 0, 1],
  perspectiveOrientation: [ 0, 0, 0, 1],
  perspectiveZoom: 2e5,
  zoom: 1e5
}
initialState.viewerState.navigation = currentNavigation

describe('> viewerState.useEffect.ts', () => {
  describe('> ViewerStateControllerUseEffect', () => {
    let actions$: Observable<any>
    let spy: jasmine.Spy
    beforeEach(async(() => {

      const mock = new MockCoordXformService()
      spy = spyOn(mock, 'getPointCoordinatesForTemplate').and.callThrough()
      returnPosition = null

      TestBed.configureTestingModule({
        imports: [
          AngularMaterialModule,
          HttpClientModule,
          WidgetModule,
          PluginModule,
        ],
        providers: [
          ViewerStateControllerUseEffect,
          provideMockActions(() => actions$),
          provideMockStore({ initialState }),
          {
            provide: TemplateCoordinatesTransformation,
            useValue: mock
          },
          {
            provide: PureContantService,
            useValue: {
              allFetchingReady$: of(true),
              initFetchTemplate$: of([]),
            }
          }
        ]
      }).compileComponents()
    }))

    describe('> selectTemplate$', () => {
      beforeEach(() => {

        actions$ = hot(
          'a',
          {
            a: viewerStateSelectTemplateWithName({ payload: reconstitutedColin })
          }
        )
      })
      describe('> when transiting from template A to template B', () => {
        describe('> if the current navigation is correctly formed', () => {
          it('> uses current navigation param', () => {

            const viewerStateCtrlEffect = TestBed.inject(ViewerStateControllerUseEffect)
            expect(
              viewerStateCtrlEffect.selectTemplate$
            ).toBeObservable(
              hot(
                'a',
                {
                  a: viewerStateNewViewer({
                      selectTemplate: reconstitutedColin,
                      selectParcellation: reconstitutedColin.parcellations[0],
                    })
                }
              )
            )
            expect(spy).toHaveBeenCalledWith(
              reconstitutedBigBrain.name,
              reconstitutedColin.name,
              initialState.viewerState.navigation.position
            )
          })
        })

        describe('> if current navigation is malformed', () => {
          it('> if current navigation is undefined, use nehubaConfig of last template', () => {

            const mockStore = TestBed.inject(MockStore)
            mockStore.overrideSelector(viewerStateNavigationStateSelector, null)
            const viewerStateCtrlEffect = TestBed.inject(ViewerStateControllerUseEffect)

            expect(
              viewerStateCtrlEffect.selectTemplate$
            ).toBeObservable(
              hot(
                'a',
                {
                  a: viewerStateNewViewer({
                      selectTemplate: reconstitutedColin,
                      selectParcellation: reconstitutedColin.parcellations[0],
                    })
                }
              )
            )
            const { position } = cvtNehubaConfigToNavigationObj(reconstitutedBigBrain.nehubaConfig.dataset.initialNgState)

            expect(spy).toHaveBeenCalledWith(
              reconstitutedBigBrain.name,
              reconstitutedColin.name,
              position
            )
          })
  
          it('> if current navigation is empty object, use nehubaConfig of last template', () => {

            const mockStore = TestBed.inject(MockStore)
            mockStore.overrideSelector(viewerStateNavigationStateSelector, {})
            const viewerStateCtrlEffect = TestBed.inject(ViewerStateControllerUseEffect)

            expect(
              viewerStateCtrlEffect.selectTemplate$
            ).toBeObservable(
              hot(
                'a',
                {
                  a: viewerStateNewViewer({
                      selectTemplate: reconstitutedColin,
                      selectParcellation: reconstitutedColin.parcellations[0],
                    })
                }
              )
            )
            const { position } = cvtNehubaConfigToNavigationObj(reconstitutedBigBrain.nehubaConfig.dataset.initialNgState)

            expect(spy).toHaveBeenCalledWith(
              reconstitutedBigBrain.name,
              reconstitutedColin.name,
              position
            )
          })
        })
  
      })

      it('> if coordXform returns error', () => {
        const viewerStateCtrlEffect = TestBed.inject(ViewerStateControllerUseEffect)
        expect(
          viewerStateCtrlEffect.selectTemplate$
        ).toBeObservable(
          hot(
            'a',
            {
              a: viewerStateNewViewer({
                  selectTemplate: reconstitutedColin,
                  selectParcellation: reconstitutedColin.parcellations[0],
                })
            }
          )
        )
      })

      it('> if coordXform complete', () => {
        returnPosition = [ 1.11e6, 2.22e6, 3.33e6 ]

        const viewerStateCtrlEffect = TestBed.inject(ViewerStateControllerUseEffect)
        const updatedColin = JSON.parse( JSON.stringify( reconstitutedColin ) )
        const initialNgState = updatedColin.nehubaConfig.dataset.initialNgState
        const updatedColinNavigation = updatedColin.nehubaConfig.dataset.initialNgState.navigation

        const { zoom, orientation, perspectiveOrientation, position, perspectiveZoom } = currentNavigation

        for (const idx of [0, 1, 2]) {
          updatedColinNavigation.pose.position.voxelCoordinates[idx] = returnPosition[idx] / updatedColinNavigation.pose.position.voxelSize[idx]
        }
        updatedColinNavigation.zoomFactor = zoom
        updatedColinNavigation.pose.orientation = orientation
        initialNgState.perspectiveOrientation = perspectiveOrientation
        initialNgState.perspectiveZoom = perspectiveZoom
        
        expect(
          viewerStateCtrlEffect.selectTemplate$
        ).toBeObservable(
          hot(
            'a',
            {
              a: viewerStateNewViewer({
                  selectTemplate: updatedColin,
                  selectParcellation: updatedColin.parcellations[0],
                })
            }
          )
        )
      })

    })
  
    describe('> navigateToRegion$', () => {
      const setAction = region => {
        actions$ = hot(
          'a',
          {
            a: viewerStateNavigateToRegion({
              payload: { region }
            })
          }
        )
      }
      describe('> if the region has malformed position property', () => {
        describe('> if the region has no position property', () => {
          const region = {
            name: 'foobar'
          }
          beforeEach(() => {
            setAction(region)
          })

          it('> should result in general action error', () => {
            const ctrlUseEffect = TestBed.inject(ViewerStateControllerUseEffect)
            expect(ctrlUseEffect.navigateToRegion$).toBeObservable(
              hot('a', {
                a: generalActionError({
                  message: `${region.name} - does not have a position defined`
                })
              })
            )
          })
        
          describe('> if the region has non array position property', () => {
            const region = {
              name: 'foo bar2',
              position: {'hello': 'world'}
            }
            beforeEach(() => {
              setAction(region)
            })
            it('> should result in general action error', () => {
              const ctrlUseEffect = TestBed.inject(ViewerStateControllerUseEffect)
              expect(ctrlUseEffect.navigateToRegion$).toBeObservable(
                hot('a', {
                  a: generalActionError({
                    message: `${region.name} has malformed position property: ${JSON.stringify(region.position)}`
                  })
                })
              )
            })
          })
        
          describe('> if the region has array position, but not all elements are number', () => {
            const region = {
              name: 'foo bar2',
              position: [0, 1, 'hello world']
            }
            beforeEach(() => {
              setAction(region)
            })
            it('> should result in general action error', () => {
              const ctrlUseEffect = TestBed.inject(ViewerStateControllerUseEffect)
              expect(ctrlUseEffect.navigateToRegion$).toBeObservable(
                hot('a', {
                  a: generalActionError({
                    message: `${region.name} has malformed position property: ${JSON.stringify(region.position)}`
                  })
                })
              )
            })
          })
        
          describe('> if the region has array position, but some elements are NaN', () => {
            const region = {
              name: 'foo bar2',
              position: [0, 1, NaN]
            }
            beforeEach(() => {
              setAction(region)
            })
            it('> should result in general action error', () => {
              const ctrlUseEffect = TestBed.inject(ViewerStateControllerUseEffect)
              expect(ctrlUseEffect.navigateToRegion$).toBeObservable(
                hot('a', {
                  a: generalActionError({
                    message: `${region.name} has malformed position property: ${JSON.stringify(region.position)}`
                  })
                })
              )
            })
          })
        
        
          describe('> if the region has array position, with incorrect length', () => {
            const region = {
              name: 'foo bar2',
              position: []
            }
            beforeEach(() => {
              setAction(region)
            })
            it('> should result in general action error', () => {
              const ctrlUseEffect = TestBed.inject(ViewerStateControllerUseEffect)
              expect(ctrlUseEffect.navigateToRegion$).toBeObservable(
                hot('a', {
                  a: generalActionError({
                    message: `${region.name} has malformed position property: ${JSON.stringify(region.position)}`
                  })
                })
              )
            })
          })
        
        })
      })
    })
  
    describe('> onSelectAtlasSelectTmplParc$', () => {
      let mockStore: MockStore
      beforeEach(() => {
        mockStore = TestBed.inject(MockStore)
      })

      it('> if atlas not found, return general error', () => {
        mockStore.overrideSelector(viewerStateFetchedTemplatesSelector, [])
        mockStore.overrideSelector(viewerStateFetchedAtlasesSelector, [])
        actions$ = hot('a', {
          a: viewerStateSelectAtlas({
            atlas: {
              ['@id']: 'foo-bar',
            }
          })
        })
        
        const viewerSTateCtrlEffect = TestBed.inject(ViewerStateControllerUseEffect)
        expect(
          viewerSTateCtrlEffect.onSelectAtlasSelectTmplParc$
        ).toBeObservable(
          hot('a', {
            a: generalActionError({
              message: CONST.ATLAS_NOT_FOUND
            })
          })
        )
      })
    
      describe('> if atlas found, will try to find id of first template', () => {
        const mockParc1 = {
          ['@id']: 'parc-1',
          availableIn: [{
            ['@id']: 'test-1'
          }]
        }
        const mockParc0 = {
          ['@id']: 'parc-0',
          availableIn: [{
            ['@id']: 'hello world'
          }]
        }
        const mockTmplSpc = {
          ['@id']: 'hello world',
          availableIn: [ mockParc0 ]
        }
        const mockTmplSpc1 = {
          ['@id']: 'test-1',
          availableIn: [ mockParc1 ]
        }
        it('> if fails, will return general error', () => {

          mockStore.overrideSelector(viewerStateFetchedTemplatesSelector, [
            mockTmplSpc1
          ])
          mockStore.overrideSelector(viewerStateFetchedAtlasesSelector, [{
            ['@id']: 'foo-bar',
            templateSpaces: [ mockTmplSpc ]
          }])
          actions$ = hot('a', {
            a: viewerStateSelectAtlas({
              atlas: {
                ['@id']: 'foo-bar',
              }
            })
          })
          
          const viewerSTateCtrlEffect = TestBed.inject(ViewerStateControllerUseEffect)
          expect(
            viewerSTateCtrlEffect.onSelectAtlasSelectTmplParc$
          ).toBeObservable(
            hot('a', {
              a: generalActionError({
                message: CONST.TEMPLATE_NOT_FOUND
              })
            })
          )
        })
      
        it('> if succeeds, will dispatch new viewer', () => {
          const completeMocktmpl = {
            ...mockTmplSpc1,
            parcellations: [ mockParc1 ]
          }
          mockStore.overrideSelector(viewerStateFetchedTemplatesSelector, [
            completeMocktmpl
          ])
          mockStore.overrideSelector(viewerStateFetchedAtlasesSelector, [{
            ['@id']: 'foo-bar',
            templateSpaces: [ mockTmplSpc1 ]
          }])
          actions$ = hot('a', {
            a: viewerStateSelectAtlas({
              atlas: {
                ['@id']: 'foo-bar',
              }
            })
          })
          
          const viewerSTateCtrlEffect = TestBed.inject(ViewerStateControllerUseEffect)
          expect(
            viewerSTateCtrlEffect.onSelectAtlasSelectTmplParc$
          ).toBeObservable(
            hot('a', {
              a: viewerStateNewViewer({
                selectTemplate: completeMocktmpl,
                selectParcellation: mockParc1
              })
            })
          )
        })
      })
    })
  
  })

  describe('> cvtNehubaConfigToNavigationObj', () => {
    describe('> returns default obj when input is malformed', () => {
      it('> if no arg is provided', () => {

        const obj = cvtNehubaConfigToNavigationObj()
        expect(obj).toEqual({
          orientation: [0, 0, 0, 1],
          perspectiveOrientation: [0 , 0, 0, 1],
          perspectiveZoom: 1e6,
          zoom: 1e6,
          position: [0, 0, 0],
          positionReal: true
        })
      })
      it('> if null or undefined is provided', () => {

        const obj = cvtNehubaConfigToNavigationObj(null)
        expect(obj).toEqual(defaultNavigationObject)

        const obj2 = cvtNehubaConfigToNavigationObj(undefined)
        expect(obj2).toEqual(defaultNavigationObject)
      })
      it('> if malformed', () => {
        
        const obj = cvtNehubaConfigToNavigationObj(reconstitutedBigBrain)
        expect(obj).toEqual(defaultNavigationObject)

        const obj2 = cvtNehubaConfigToNavigationObj({})
        expect(obj2).toEqual(defaultNavigationObject)
      })
    })
    it('> converts nehubaConfig object to navigation object', () => {

      const obj = cvtNehubaConfigToNavigationObj(reconstitutedBigBrain.nehubaConfig.dataset.initialNgState)
      expect(obj).toEqual({
        orientation: [0, 0, 0, 1],
        perspectiveOrientation: [
          0.3140767216682434,
          -0.7418519854545593,
          0.4988985061645508,
          -0.3195493221282959
        ],
        perspectiveZoom: 1922235.5293810747,
        zoom: 350000,
        position: [ -463219.89446663484, 325772.3617553711, 601535.3736234978 ],
        positionReal: true
      })
    })
  })
  describe('> cvtNavigationObjToNehubaConfig', () => {
    const validNehubaConfigObj = reconstitutedBigBrain.nehubaConfig.dataset.initialNgState
    const validNavigationObj = currentNavigation
    describe('> if inputs are malformed', () => {
      describe('> if navigation object is malformed, uses navigation default object', () => {
        it('> if navigation object is null', () => {
          const v1 = cvtNavigationObjToNehubaConfig(null, validNehubaConfigObj)
          const v2 = cvtNavigationObjToNehubaConfig(defaultNavigationObject, validNehubaConfigObj)
          expect(v1).toEqual(v2)
        })
        it('> if navigation object is undefined', () => {
          const v1 = cvtNavigationObjToNehubaConfig(undefined, validNehubaConfigObj)
          const v2 = cvtNavigationObjToNehubaConfig(defaultNavigationObject, validNehubaConfigObj)
          expect(v1).toEqual(v2)
        })

        it('> if navigation object is otherwise malformed', () => {
          const v1 = cvtNavigationObjToNehubaConfig(reconstitutedBigBrain, validNehubaConfigObj)
          const v2 = cvtNavigationObjToNehubaConfig(defaultNavigationObject, validNehubaConfigObj)
          expect(v1).toEqual(v2)

          const v3 = cvtNavigationObjToNehubaConfig({}, validNehubaConfigObj)
          const v4 = cvtNavigationObjToNehubaConfig(defaultNavigationObject, validNehubaConfigObj)
          expect(v3).toEqual(v4)
        })
      })

      describe('> if nehubaConfig object is malformed, use default nehubaConfig obj', () => {
        it('> if nehubaConfig is null', () => {
          const v1 = cvtNavigationObjToNehubaConfig(validNavigationObj, null)
          const v2 = cvtNavigationObjToNehubaConfig(validNavigationObj, defaultNehubaConfigObject)
          expect(v1).toEqual(v2)
        })

        it('> if nehubaConfig is undefined', () => {
          const v1 = cvtNavigationObjToNehubaConfig(validNavigationObj, undefined)
          const v2 = cvtNavigationObjToNehubaConfig(validNavigationObj, defaultNehubaConfigObject)
          expect(v1).toEqual(v2)
        })

        it('> if nehubaConfig is otherwise malformed', () => {
          const v1 = cvtNavigationObjToNehubaConfig(validNavigationObj, {})
          const v2 = cvtNavigationObjToNehubaConfig(validNavigationObj, defaultNehubaConfigObject)
          expect(v1).toEqual(v2)

          const v3 = cvtNavigationObjToNehubaConfig(validNavigationObj, reconstitutedBigBrain)
          const v4 = cvtNavigationObjToNehubaConfig(validNavigationObj, defaultNehubaConfigObject)
          expect(v3).toEqual(v4)
        })
      })
    })
    it('> converts navigation object and reference nehuba config object to navigation object', () => {
      const convertedVal = cvtNavigationObjToNehubaConfig(validNavigationObj, validNehubaConfigObj)
      const { perspectiveOrientation, orientation, zoom, perspectiveZoom, position } = validNavigationObj
      
      expect(convertedVal).toEqual({
        navigation: {
          pose: {
            position: {
              voxelSize: validNehubaConfigObj.navigation.pose.position.voxelSize,
              voxelCoordinates: [0, 1, 2].map(idx => position[idx] / validNehubaConfigObj.navigation.pose.position.voxelSize[idx])
            },
            orientation
          },
          zoomFactor: zoom
        },
        perspectiveOrientation: perspectiveOrientation,
        perspectiveZoom: perspectiveZoom
      })
    })
  })
})
