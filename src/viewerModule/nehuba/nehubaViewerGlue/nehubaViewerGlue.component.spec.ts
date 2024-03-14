import { CommonModule } from "@angular/common"
import { Component, Directive } from "@angular/core"
import { ComponentFixture, TestBed } from "@angular/core/testing"
import { FormsModule, ReactiveFormsModule } from "@angular/forms"
import { MockStore, provideMockStore } from "@ngrx/store/testing"
import { NEVER, Subject } from "rxjs"
import { ComponentsModule } from "src/components"
import { ClickInterceptorService } from "src/glue"
import { LayoutModule } from "src/layouts/layout.module"
import { QuickTourModule } from "src/ui/quickTour"
import { AngularMaterialModule } from "src/sharedModules/angularMaterial.module"
import { ClickInterceptor, CLICK_INTERCEPTOR_INJECTOR, UtilModule } from "src/util"
import { WindowResizeModule } from "src/util/windowResize"
import { NehubaLayerControlService } from "../layerCtrl.service"
import { NehubaMeshService } from "../mesh.service"
import { NehubaViewerTouchDirective } from "../nehubaViewerInterface/nehubaViewerTouch.directive"
import { selectorAuxMeshes } from "../store"
import { NehubaGlueCmp } from "./nehubaViewerGlue.component"
import { AtlasWorkerService } from "src/atlasViewer/atlasViewer.workerService.service"
import { userInterface, atlasSelection, atlasAppearance, annotation, userInteraction } from "src/state"
import { SAPIModule } from "src/atlasComponents/sapi"
import { SxplrParcellation, SxplrAtlas, SxplrRegion, SxplrTemplate } from "src/atlasComponents/sapi/sxplrTypes"
import { LayerCtrlEffects } from "../layerCtrl.service/layerCtrl.effects"
import { NEHUBA_INSTANCE_INJTKN } from "../util"
import { RouterService } from "src/routerModule/router.service"

@Component({
  selector: 'viewer-ctrl-component',
  template: ''
})

class MockViewerCtrlCmp{}

@Directive({
  selector: '[iav-nehuba-viewer-container]',
  exportAs: 'iavNehubaViewerContainer',
})

class MockNehubaViewerContainerDirective{
  public viewportToDatas: any
  public nehubaViewerInstance = {
    nehubaViewer: {
      ngviewer: null
    }
  }
  mouseOverSegments = NEVER
  navigationEmitter = NEVER
  mousePosEmitter = NEVER
}

describe('> nehubaViewerGlue.component.ts', () => {
  let mockStore: MockStore
  let fixture: ComponentFixture<NehubaGlueCmp>
  const selectedATPR$ = new Subject<{
    atlas: SxplrAtlas,
    parcellation: SxplrParcellation,
    template: SxplrTemplate,
    regions: SxplrRegion[],
  }>()
  beforeEach( async () => {
    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        AngularMaterialModule,
        FormsModule,
        ReactiveFormsModule,

        QuickTourModule,
        ComponentsModule,
        UtilModule,
        WindowResizeModule,
        LayoutModule,
        SAPIModule,
      ],
      declarations: [
        NehubaGlueCmp,
        MockViewerCtrlCmp,

        // TODO this may introduce a lot more dep
        MockNehubaViewerContainerDirective,
        NehubaViewerTouchDirective,
      ],
      providers: [
        /**
         * TODO, figureout which dependency is selecting viewerState.parcellationSelected
         * then remove the inital state
         */
        provideMockStore(),
        {
          provide: CLICK_INTERCEPTOR_INJECTOR,
          useFactory: (clickIntService: ClickInterceptorService) => {
            return {
              deregister: clickIntService.deregister.bind(clickIntService),
              register: arg => clickIntService.register(arg)
            } as ClickInterceptor
          },
          deps: [
            ClickInterceptorService
          ]
        },{
          provide: NehubaLayerControlService,
          useValue: {
            setColorMap$: new Subject(),
            visibleLayer$: new Subject(),
            segmentVis$: new Subject(),
            ngLayersController$: new Subject(),
            selectedATPR$
          }
        },{
          provide: RouterService,
          useValue: {
            customRoute$: NEVER
          }
        }, {
          provide: NehubaMeshService,
          useValue: {
            loadMeshes$: new Subject()
          }
        }, {
          provide: AtlasWorkerService,
          useValue: {
            sendMessage: async () => {
              return {
                result: {
                  meta: {},
                  buffer: null
                }
              }
            }
          }
        },{
          provide: NEHUBA_INSTANCE_INJTKN,
          useValue: NEVER
        },
        {
          provide: LayerCtrlEffects,
          useValue: {
            onATPDebounceNgLayers$: NEVER
          }
        }
      ]
    }).compileComponents()
  })

  beforeEach(() => {
    mockStore = TestBed.inject(MockStore)
    mockStore.overrideSelector(userInterface.selectors.panelMode, "FOUR_PANEL")
    mockStore.overrideSelector(userInterface.selectors.panelOrder, '0123')
    mockStore.overrideSelector(atlasAppearance.selectors.octantRemoval, true)

    mockStore.overrideSelector(atlasSelection.selectors.selectedAtlas, null)
    mockStore.overrideSelector(atlasSelection.selectors.selectedTemplate, null)
    mockStore.overrideSelector(atlasSelection.selectors.selectedParcellation, null)
    mockStore.overrideSelector(atlasSelection.selectors.selectedRegions, [])
    mockStore.overrideSelector(atlasSelection.selectors.selectedParcAllRegions, [])
    mockStore.overrideSelector(userInteraction.selectors.mousingOverRegions, [])

    mockStore.overrideSelector(atlasSelection.selectors.navigation, null)
    mockStore.overrideSelector(atlasAppearance.selectors.showDelineation, true)
    mockStore.overrideSelector(atlasAppearance.selectors.customLayers, [])
    mockStore.overrideSelector(annotation.selectors.annotations, [])

    mockStore.overrideSelector(selectorAuxMeshes, [])
  })


  it('> can be init', () => {
    fixture = TestBed.createComponent(NehubaGlueCmp)
    expect(fixture.componentInstance).toBeTruthy()
  })


})
