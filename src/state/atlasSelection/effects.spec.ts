import { TestBed } from "@angular/core/testing"
import { provideMockActions } from "@ngrx/effects/testing"
import { Action } from "@ngrx/store"
import { MockStore, provideMockStore } from "@ngrx/store/testing"
import { hot } from "jasmine-marbles"
import { Observable, of, throwError } from "rxjs"
import { SAPI, SAPIModule, SapiRegionModel, SapiAtlasModel, SapiSpaceModel, SapiParcellationModel } from "src/atlasComponents/sapi"
import { IDS } from "src/atlasComponents/sapi/constants"
import { actions, selectors } from "."
import { Effect } from "./effects"
import * as mainActions from "../actions"
import { atlasSelection } from ".."

describe("> effects.ts", () => {
  describe("> Effect", () => {

    let actions$ = new Observable<Action>()
    let hoc1left: SapiRegionModel
    let hoc1leftCentroid: SapiRegionModel
    let hoc1leftCentroidWrongSpc: SapiRegionModel

    beforeEach(async () => {
      TestBed.configureTestingModule({
        imports: [
          // HttpClientTestingModule,
          SAPIModule
        ],
        providers: [
          Effect,
          provideMockStore(),
          provideMockActions(() => actions$)
        ]
      })

      /**
       * only need to populate hoc1 left once
       */
      if (!hoc1left) {

        const sapisvc = TestBed.inject(SAPI)
        const regions = await sapisvc.getParcRegions(IDS.ATLAES.HUMAN, IDS.PARCELLATION.JBA29, IDS.TEMPLATES.MNI152).toPromise()
        hoc1left = regions.find(r => /hoc1/i.test(r.name) && /left/i.test(r.name))
        if (!hoc1left) throw new Error(`cannot find hoc1 left`)
        hoc1leftCentroid = JSON.parse(JSON.stringify(hoc1left)) 
        hoc1leftCentroid.hasAnnotation.bestViewPoint = {
          coordinateSpace: {
            '@id': IDS.TEMPLATES.BIG_BRAIN
          },
          coordinates: [{
            value: 1
          }, {
            value: 2
          }, {
            value: 3
          }]
        }
        hoc1leftCentroidWrongSpc = JSON.parse(JSON.stringify(hoc1leftCentroid))
        hoc1leftCentroidWrongSpc.hasAnnotation.bestViewPoint.coordinateSpace['@id'] = IDS.TEMPLATES.COLIN27
      }
    })

    it('> can be init', () => {
      const effects = TestBed.inject(Effect)
      expect(effects).toBeTruthy()
    })

    describe('> selectTemplate$', () => {

      describe('> when transiting from template A to template B', () => {
        describe('> if the current navigation is correctly formed', () => {
          it('> uses current navigation param', () => {

          })
        })

        describe('> if current navigation is malformed', () => {
          it('> if current navigation is undefined, use nehubaConfig of last template', () => {
          })
  
          it('> if current navigation is empty object, use nehubaConfig of last template', () => {
          })
        })
  
      })

      it('> if coordXform returns error', () => {

      })

      it('> if coordXform complete', () => {

      })

    })

    describe("> onTemplateParcSelectionPostHook", () => {
      describe("> 0", () => {
      })
      describe("> 1", () => {
        const currNavigation = {
          orientation: [0, 0, 0, 1],
          perspectiveOrientation: [0, 0, 0, 1],
          perspectiveZoom: 1,
          position: [1, 2, 3], 
          zoom: 1
        }
        beforeEach(() => {
          const store = TestBed.inject(MockStore)
          store.overrideSelector(atlasSelection.selectors.navigation, currNavigation)
        })
        describe("> when atlas is different", () => {
          describe("> if no atlas prior", () => {

            it("> navigation should be reset", () => {
              const effects = TestBed.inject(Effect)
              const hook = effects.onTemplateParcSelectionPostHook[1]
              const obs = hook({
                current: {
                  atlas: null,
                  parcellation: null,
                  template: null
                },
                previous: {
                  atlas: {
                    "@id": IDS.ATLAES.RAT
                  } as any,
                  parcellation: {
                    "@id": IDS.PARCELLATION.WAXHOLMV4
                  } as any,
                  template: {
                    "@id": IDS.TEMPLATES.WAXHOLM
                  } as any,
                }
              })

              expect(obs).toBeObservable(
                hot('(a|)', {
                  a: {
                    navigation: null
                  }
                })
              )
            })
          })
          describe("> if different atlas prior", () => {

            it("> navigation should be reset", () => {
              const effects = TestBed.inject(Effect)
              const hook = effects.onTemplateParcSelectionPostHook[1]
              const obs = hook({
                current: {
                  atlas: {
                    "@id": IDS.ATLAES.HUMAN
                  } as any,
                  parcellation: {
                    "@id": IDS.PARCELLATION.JBA29
                  } as any,
                  template: {
                    "@id": IDS.TEMPLATES.MNI152
                  } as any,
                },
                previous: {
                  atlas: {
                    "@id": IDS.ATLAES.RAT
                  } as any,
                  parcellation: {
                    "@id": IDS.PARCELLATION.WAXHOLMV4
                  } as any,
                  template: {
                    "@id": IDS.TEMPLATES.WAXHOLM
                  } as any,
                }
              })

              expect(obs).toBeObservable(
                hot('(a|)', {
                  a: {
                    navigation: null
                  }
                })
              )
            })
          })
        })
      })
    })
  
    describe('> if selected atlas has no matching tmpl space', () => {

      it('> should emit gernal error', () => {

      })
    })

    describe('> if selected atlas has matching tmpl', () => {

      describe('> if parc is empty array', () => {
        it('> should emit with falsy as payload', () => {

        })
      })
      describe('> if no parc has eligible @id', () => {

        it('> should emit with falsy as payload', () => {

        })
      })

      describe('> if some parc has eligible @id', () => {
        describe('> if no @version is available', () => {

          it('> selects the first parc', () => {

          })
        })

        describe('> if @version is available', () => {
          
          describe('> if there exist an entry without @next attribute', () => {
            
            it('> selects the first one without @next attribute', () => {
            })
          })
          describe('> if there exist no entry without @next attribute', () => {
            
            it('> selects the first one without @next attribute', () => {

            })
          })
        })
      })
    })

    describe('> onNavigateToRegion', () => {
      beforeEach(async () => {
        actions$ = hot('a', {
          a: actions.navigateToRegion({
            region: hoc1left
          })
        })
        const mockStore = TestBed.inject(MockStore)
        mockStore.overrideSelector(selectors.selectedAtlas, {
          "@id": IDS.ATLAES.HUMAN
        } as SapiAtlasModel)
        mockStore.overrideSelector(selectors.selectedTemplate, {
          "@id": IDS.TEMPLATES.MNI152
        } as SapiSpaceModel)
        mockStore.overrideSelector(selectors.selectedParcellation, {
          "@id": IDS.PARCELLATION.JBA29
        } as SapiParcellationModel)
      })

      describe('> if atlas, template, parc is not set', () => {
        const atp = [{
          name: 'atlas',
          atpSelector: selectors.selectedAtlas
        },{
          name: 'template',
          atpSelector: selectors.selectedTemplate
        },{
          name: 'parcellation',
          atpSelector: selectors.selectedParcellation
        }]
        for (const { name, atpSelector } of atp) {
          describe(`> if ${name} is unset`, () => {

            beforeEach(() => {
              const mockStore = TestBed.inject(MockStore)
              mockStore.overrideSelector(atpSelector, null)
            })

            it('> returns general error', () => {
              const effect = TestBed.inject(Effect)
              expect(effect.onNavigateToRegion).toBeObservable(
                hot('a', {
                  a: mainActions.generalActionError({
                    message: `atlas, template, parcellation or region not set`
                  })
                })
              )
            })
          })
        }
      })

      describe('> if atlas, template, parc is set, but region unset', () => {

        beforeEach(() => {
          actions$ = hot('a', {
            a: actions.navigateToRegion({
              region: null
            })
          })
        })
        it('> returns general error', () => {
          const effect = TestBed.inject(Effect)
          expect(effect.onNavigateToRegion).toBeObservable(
            hot('a', {
              a: mainActions.generalActionError({
                message: `atlas, template, parcellation or region not set`
              })
            })
          )
        })
      })

      describe('> if inputs are fine', () => {
        let getRegionSpy: jasmine.Spy
        let regionGetDetailSpy: jasmine.Spy = jasmine.createSpy()
        beforeEach(() => {
          const sapi = TestBed.inject(SAPI)
          getRegionSpy = spyOn(sapi, 'getRegion')
          getRegionSpy.and.returnValue({
            getDetail: regionGetDetailSpy
          })
          regionGetDetailSpy.and.returnValue(
            of(hoc1leftCentroid)
          )
        })
        afterEach(() => {
          if (getRegionSpy) getRegionSpy.calls.reset()
          if (regionGetDetailSpy) regionGetDetailSpy.calls.reset()
        })
        it('> getRegionDetailSpy is called, and calls navigateTo', () => {
          const eff = TestBed.inject(Effect)
          expect(eff.onNavigateToRegion).toBeObservable(
            hot(`a`, {
              a: actions.navigateTo({
                navigation: {
                  position: [1e6, 2e6, 3e6]
                },
                animation: true
              })
            })
          )
          expect(getRegionSpy).toHaveBeenCalledTimes(1)
          expect(getRegionSpy).toHaveBeenCalledWith(IDS.ATLAES.HUMAN, IDS.PARCELLATION.JBA29, hoc1left["@id"])
        })

        describe('> mal formed return', () => {
          describe('> returns null', () => {
            beforeEach(() => {

              regionGetDetailSpy.and.returnValue(
                of(null)
              )
            })
            it('> generalactionerror', () => {

              const eff = TestBed.inject(Effect)
              expect(eff.onNavigateToRegion).toBeObservable(
                hot(`a`, {
                  a: mainActions.generalActionError({
                    message: `getting region detail error! cannot get coordinates`
                  })
                })
              )
            })
          })
          describe('> general throw', () => {
            beforeEach(() => {
              regionGetDetailSpy.and.returnValue(
                throwError(`oh noes`)
              )
            })
            it('> generalactionerror', () => {

              const eff = TestBed.inject(Effect)
              expect(eff.onNavigateToRegion).toBeObservable(
                hot(`a`, {
                  a: mainActions.generalActionError({
                    message: `Error getting region centroid`
                  })
                })
              )
            })

          })
          describe('> does not contain props attr', () => {

            beforeEach(() => {
              regionGetDetailSpy.and.returnValue(
                of(hoc1left)
              )
            })
            it('> generalactionerror', () => {

              const eff = TestBed.inject(Effect)
              expect(eff.onNavigateToRegion).toBeObservable(
                hot(`a`, {
                  a: mainActions.generalActionError({
                    message: `getting region detail error! cannot get coordinates`
                  })
                })
              )
            })
          })
        })
      })
    })
  })
})