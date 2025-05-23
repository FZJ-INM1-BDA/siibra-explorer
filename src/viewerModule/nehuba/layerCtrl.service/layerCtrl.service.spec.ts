import { fakeAsync, TestBed } from "@angular/core/testing"
import { MockStore, provideMockStore } from "@ngrx/store/testing"
import { NehubaLayerControlService } from "./layerCtrl.service"
import {
  annotation,
  atlasAppearance,
  atlasSelection
} from "src/state"
import { LayerCtrlEffects } from "./layerCtrl.effects"
import { NEVER } from "rxjs"
import { RouterService } from "src/routerModule/router.service"
import { HttpClientModule } from "@angular/common/http"
import { BaseService } from "../base.service/base.service"

describe('> layerctrl.service.ts', () => {
  describe('> NehubaLayerControlService', () => {
    let mockStore: MockStore
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports:[
          HttpClientModule,
        ],
        providers: [
          {
            provide: RouterService,
            useValue: {
              customRoute$: NEVER
            }
          },
          NehubaLayerControlService,
          provideMockStore(),
          {
            provide: LayerCtrlEffects,
            useValue: {
              onATPDebounceNgLayers$: NEVER
            }
          },
          {
            provide: BaseService,
            useValue: {
              selectedATPR$: NEVER,
              completeNgIdLabelRegionMap$: NEVER,
            }
          }
        ]
      })

      mockStore = TestBed.inject(MockStore)
      mockStore.overrideSelector(atlasAppearance.selectors.customLayers, [])
      mockStore.overrideSelector(atlasAppearance.selectors.showDelineation, true)
      mockStore.overrideSelector(annotation.selectors.annotations, [])
      mockStore.overrideSelector(atlasSelection.selectors.selectedRegions, [])
      mockStore.overrideSelector(atlasSelection.selectors.selectedTemplate, {} as any)
      mockStore.overrideSelector(atlasSelection.selectors.selectedParcellation, {} as any)
    })

    it('> can be init', () => {
      const service = TestBed.inject(NehubaLayerControlService)
      expect(service).toBeTruthy()
    })

    describe('> setColorMap$', () => {
      describe('> overwriteColorMap$ not firing', () => {
        describe('> template/parc has no aux meshes', () => {

          it('> calls getMultiNgIdsRegionsLabelIndexMapReturn', () => {
            
          })

          it('> emitted value is as expected', fakeAsync(() => {

          }))

        })

        describe('> template/parc has aux meshes', () => {

          beforeEach(() => {

          })

          it('> should inherit values from tmpl and parc',  fakeAsync(() => {

          }))

          it('> should overwrite any value if at all, from region', fakeAsync(() => {

          }))
        })
      })

      const foobar1 = {
        'foo-bar': {
          1: { red: 100, green: 200, blue: 255 },
          2: { red: 15, green: 15, blue: 15 },
        }
      }
      const foobar2 = {
        'foo-bar': {
          2: { red: 255, green: 255, blue: 255 },
        }
      }
    
      describe('> overwriteColorMap$ firing', () => {
        beforeEach(() => {
        })

        it('> should overwrite existing colormap', () => {

        })

        it('> unsub/resub should not result in overwritecolormap last emitted value', fakeAsync(() => {

        }))
      })
    })


    describe('> visibleLayer$', () => {
      beforeEach(() => {

      })
      it('> combines ngId of template, aux mesh and regions', () => {

      })
    })

    describe('> segmentVis$', () => {
      const region1= {
        ngId: 'ngid',
        labelIndex: 1
      }
      const region2= {
        ngId: 'ngid',
        labelIndex: 2
      }
      beforeEach(() => {
      })

      it('> by default, should return []', () => {

      })

      describe('> if sel regions exist', () => {
        beforeEach(() => {

        })

        it('> default, should return encoded strings', () => {

        })

        it('> if clearflag is true, then return []', () => {

        })        
      })

      describe('> if non mixable layer exist', () => {
        beforeEach(() => {
        })

        it('> default, should return null', () => {

        })

        it('> if regions selected, should still return null', () => {

        })

        describe('> if clear flag is set', () => {
          beforeEach(() => {
            
          })

          it('> default, should return []', () => {
          })

          it('> if reg selected, should return []', () => {

          })
        })
      })
    })

    describe('> ngLayersController$', () => {
      
    })
  })
})
