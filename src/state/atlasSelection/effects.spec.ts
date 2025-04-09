import { TestBed } from "@angular/core/testing"
import { provideMockActions } from "@ngrx/effects/testing"
import { Action } from "@ngrx/store"
import { MockStore, provideMockStore } from "@ngrx/store/testing"
import { hot } from "jasmine-marbles"
import { EMPTY, NEVER, ReplaySubject, of, throwError } from "rxjs"
import { SAPI, SAPIModule } from "src/atlasComponents/sapi"
import { SxplrRegion, SxplrAtlas, SxplrParcellation, SxplrTemplate } from "src/atlasComponents/sapi/sxplrTypes"
import { IDS } from "src/atlasComponents/sapi/constants"
import { actions, selectors } from "."
import { Effect } from "./effects"
import * as mainActions from "../actions"
import { atlasSelection } from ".."
import { BrowserAnimationsModule } from "@angular/platform-browser/animations"
import { translateV3Entities } from "src/atlasComponents/sapi/translateV3"
import { PathReturn } from "src/atlasComponents/sapi/typeV3"
import { MatDialog } from 'src/sharedModules/angularMaterial.exports'
import { InterSpaceCoordXformSvc } from "src/atlasComponents/sapi/core/space/interSpaceCoordXform.service"

describe("> effects.ts", () => {
  describe("> Effect", () => {

    let actions$ :ReplaySubject<Action>

    let simpleHoc1: SxplrRegion = {
      name: 'foo',
      id: '',
      type: "SxplrRegion",
      parentIds: [],
    }

    const regWithNoCentorid: PathReturn<"/regions/{region_id}"> = {
      "@id": "",
      versionIdentifier: '',
      "@type": '',
    }

    let hoc1LeftMni152: PathReturn<"/regions/{region_id}"> = {
      "@id": "",
      versionIdentifier: '',
      "@type": '',
      hasAnnotation: {
        criteriaQualityType: {},
        internalIdentifier: "",
        bestViewPoint: {
          coordinateSpace: {
            "@id": IDS.TEMPLATES.MNI152
          } as any,
          coordinates: [
            {
              value: 1,
            },{
              value: 2,
            },{
              value: 3,
            }
          ]
        }
      }
    }
    let hoc1LeftColin27: PathReturn<"/regions/{region_id}"> = {
      "@id": "",
      versionIdentifier: '',
      "@type": '',
      hasAnnotation: {
        criteriaQualityType: {},
        internalIdentifier: "",
        bestViewPoint: {
          coordinateSpace: {
            "@id": IDS.TEMPLATES.COLIN27
          } as any,
          coordinates: [
            {
              value: 1,
            },{
              value: 2,
            },{
              value: 3,
            }
          ]
        }
      }
    }

    beforeEach(async () => {
      TestBed.configureTestingModule({
        imports: [
          // HttpClientTestingModule,
          SAPIModule,
          BrowserAnimationsModule
        ],
        providers: [
          Effect,
          provideMockStore(),
          provideMockActions(() => actions$),
          {
            provide: MatDialog,
            useValue: {
              open(){
                return {
                  afterClosed() {
                    return NEVER
                  }
                }
              }
            }
          },
          {
            provide: InterSpaceCoordXformSvc,
            useValue: {
              transform() {
                return EMPTY
              }
            }
          }
        ]
      })
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
                    id: IDS.ATLASES.RAT
                  } as any,
                  parcellation: {
                    id: IDS.PARCELLATION.WAXHOLMV4
                  } as any,
                  template: {
                    id: IDS.TEMPLATES.WAXHOLM
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
                    id: IDS.ATLASES.HUMAN
                  } as any,
                  parcellation: {
                    id: IDS.PARCELLATION.JBA29
                  } as any,
                  template: {
                    id: IDS.TEMPLATES.MNI152
                  } as any,
                },
                previous: {
                  atlas: {
                    id: IDS.ATLASES.RAT
                  } as any,
                  parcellation: {
                    id: IDS.PARCELLATION.WAXHOLMV4
                  } as any,
                  template: {
                    id: IDS.TEMPLATES.WAXHOLM
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

      const translatedRegion = {
        "@id": "",
        versionIdentifier: '',
        "@type": '',
        hasAnnotation: {
          criteriaQualityType: {},
          internalIdentifier: "",
          bestViewPoint: {
            coordinateSpace: {
              "@id": IDS.TEMPLATES.MNI152
            } as any,
            coordinates: [
              {
                value: 1,
              },{
                value: 2,
              },{
                value: 3,
              }
            ]
          }
        }
      } as PathReturn<"/regions/{region_id}">

      let retrieveRegionSpy: jasmine.Spy
      let sapiV3GetSpy: jasmine.Spy

      beforeEach(async () => {
        retrieveRegionSpy = spyOn(translateV3Entities, 'retrieveRegion')
        const sapi = TestBed.inject(SAPI)
        sapiV3GetSpy = spyOn(sapi, 'v3Get')
        actions$ = new ReplaySubject()
        actions$.next(
          actions.navigateToRegion({
            region: simpleHoc1
          })
        )
         hot('a', {
          a: actions.navigateToRegion({
            region: simpleHoc1
          })
        })
        const mockStore = TestBed.inject(MockStore)
        mockStore.overrideSelector(selectors.selectedAtlas, {
          id: IDS.ATLASES.HUMAN
        } as SxplrAtlas)
        mockStore.overrideSelector(selectors.selectedTemplate, {
          id: IDS.TEMPLATES.MNI152
        } as SxplrTemplate)
        mockStore.overrideSelector(selectors.selectedParcellation, {
          id: IDS.PARCELLATION.JBA29
        } as SxplrParcellation)
      })

      afterEach(() => {
        retrieveRegionSpy.calls.reset()
        sapiV3GetSpy.calls.reset()
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
          actions$ = new ReplaySubject()
          actions$.next(
            actions.navigateToRegion({
              region: null
            })
          )
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
        beforeEach(() => {
          sapiV3GetSpy.and.returnValue(of(translatedRegion))
        })

        it("> calls v3get", () => {
          
          const eff = TestBed.inject(Effect)
          eff.onNavigateToRegion.subscribe(res => {

            expect(sapiV3GetSpy).toHaveBeenCalledWith("/regions/{region_id}", {
              path: {
                region_id: simpleHoc1.name
              },
              query: {
                parcellation_id: IDS.PARCELLATION.JBA29,
                space_id: IDS.TEMPLATES.MNI152
              }
            })
          })
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
        })

        describe('> mal formed return', () => {
          describe('> returns null', () => {
            beforeEach(() => {
              sapiV3GetSpy.and.returnValue(of(null))
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
              sapiV3GetSpy.and.returnValue(throwError('foobar'))
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
          describe('> does not contain props attr', () => {

            beforeEach(() => {
              sapiV3GetSpy.and.returnValue(of(regWithNoCentorid))
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