import { CommonModule } from "@angular/common"
import { Component, Directive } from "@angular/core"
import { ComponentFixture, TestBed } from "@angular/core/testing"
import { FormsModule, ReactiveFormsModule } from "@angular/forms"
import { MockStore, provideMockStore } from "@ngrx/store/testing"
import { NEVER, Subject } from "rxjs"
import { ComponentsModule } from "src/components"
import { ClickInterceptorService } from "src/glue"
import { LayoutModule } from "src/layouts/layout.module"
import { PANELS } from "src/services/state/ngViewerState/constants"
import { ngViewerSelectorOctantRemoval, ngViewerSelectorPanelMode, ngViewerSelectorPanelOrder } from "src/services/state/ngViewerState/selectors"
import { uiStateMouseOverSegmentsSelector } from "src/services/state/uiState/selectors"
import { viewerStateSetSelectedRegions } from "src/services/state/viewerState.store.helper"
import { viewerStateCustomLandmarkSelector, viewerStateNavigationStateSelector, viewerStateSelectedRegionsSelector } from "src/services/state/viewerState/selectors"
import { Landmark2DModule } from "src/ui/nehubaContainer/2dLandmarks/module"
import { QuickTourModule } from "src/ui/quickTour"
import { AngularMaterialModule } from "src/sharedModules/angularMaterial.module"
import { ClickInterceptor, CLICK_INTERCEPTOR_INJECTOR, UtilModule } from "src/util"
import { WindowResizeModule } from "src/util/windowResize"
import { NehubaLayerControlService } from "../layerCtrl.service"
import { MaximisePanelButton } from "../maximisePanelButton/maximisePanelButton.component"
import { NehubaMeshService } from "../mesh.service"
import { NehubaViewerTouchDirective } from "../nehubaViewerInterface/nehubaViewerTouch.directive"
import { selectorAuxMeshes } from "../store"
import { TouchSideClass } from "../touchSideClass.directive"
import { NehubaGlueCmp } from "./nehubaViewerGlue.component"
import { HarnessLoader } from "@angular/cdk/testing"
import { AtlasWorkerService } from "src/atlasViewer/atlasViewer.workerService.service"


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
  let rootLoader: HarnessLoader
  let fixture: ComponentFixture<NehubaGlueCmp>
  beforeEach( async () => {
    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        AngularMaterialModule,
        LayoutModule,
        Landmark2DModule,
        QuickTourModule,
        ComponentsModule,
        UtilModule,
        WindowResizeModule,
        FormsModule,
        ReactiveFormsModule,
        // NehubaModule,
      ],
      declarations: [
        NehubaGlueCmp,
        MaximisePanelButton,
        MockViewerCtrlCmp,
        TouchSideClass,

        // TODO this may introduce a lot more dep
        MockNehubaViewerContainerDirective,
        NehubaViewerTouchDirective,
      ],
      providers: [
        /**
         * TODO, figureout which dependency is selecting viewerState.parcellationSelected
         * then remove the inital state
         */
        provideMockStore({
          initialState: {
            viewerState: {}
          }
        }),
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
        }
      ]
    }).compileComponents()
  })

  beforeEach(() => {
    mockStore = TestBed.inject(MockStore)
    mockStore.overrideSelector(ngViewerSelectorPanelMode, PANELS.FOUR_PANEL)
    mockStore.overrideSelector(ngViewerSelectorPanelOrder, '0123')
    mockStore.overrideSelector(ngViewerSelectorOctantRemoval, true)
    mockStore.overrideSelector(viewerStateCustomLandmarkSelector, [])
    mockStore.overrideSelector(viewerStateSelectedRegionsSelector, [])
    mockStore.overrideSelector(uiStateMouseOverSegmentsSelector, [])
    mockStore.overrideSelector(viewerStateNavigationStateSelector, null)

    mockStore.overrideSelector(selectorAuxMeshes, [])
  })


  it('> can be init', () => {
    fixture = TestBed.createComponent(NehubaGlueCmp)
    expect(fixture.componentInstance).toBeTruthy()
  })

  describe('> selectHoveredRegion', () => {
    let dispatchSpy: jasmine.Spy
    let clickIntServ: ClickInterceptorService
    beforeEach(() => {
      dispatchSpy = spyOn(mockStore, 'dispatch')
      clickIntServ = TestBed.inject(ClickInterceptorService)
    })
    afterEach(() => {
      dispatchSpy.calls.reset()
    })

    describe('> if on hover is empty array', () => {
      let fallbackSpy: jasmine.Spy
      beforeEach(() => {
        fallbackSpy = spyOn(clickIntServ, 'fallback')
        TestBed.createComponent(NehubaGlueCmp)
        clickIntServ.callRegFns(null)
      })
      it('> dispatch not called', () => {
        expect(dispatchSpy).not.toHaveBeenCalled()
      })
      it('> fallback called', () => {
        expect(fallbackSpy).toHaveBeenCalled()
      })
    })

    describe('> if on hover is non object array', () => {
      let fallbackSpy: jasmine.Spy

      const testObj0 = {
        segment: 'hello world'
      }
      const testObj1 = 'hello world'
      beforeEach(() => {
        fallbackSpy = spyOn(clickIntServ, 'fallback')
        mockStore.overrideSelector(uiStateMouseOverSegmentsSelector, [testObj1, testObj0] as any)
        TestBed.createComponent(NehubaGlueCmp)
        clickIntServ.callRegFns(null)
      })
      it('> dispatch not called', () => {
        expect(dispatchSpy).not.toHaveBeenCalled()
      })
      it('> fallback called', () => {
        expect(fallbackSpy).toHaveBeenCalled()
      })
    })

    describe('> if on hover array containing at least 1 obj, only dispatch the first obj', () => {
      let fallbackSpy: jasmine.Spy
      const testObj0 = {
        segment: 'hello world'
      }
      const testObj1 = {
        segment: {
          foo: 'baz'
        }
      }
      const testObj2 = {
        segment: {
          hello: 'world'
        }
      }
      beforeEach(() => {
        fallbackSpy = spyOn(clickIntServ, 'fallback')
        mockStore.overrideSelector(uiStateMouseOverSegmentsSelector, [testObj0, testObj1, testObj2] as any)

      })
      afterEach(() => {
        fallbackSpy.calls.reset()
      })
      it('> dispatch called with obj1', () => {
        TestBed.createComponent(NehubaGlueCmp)
        clickIntServ.callRegFns(null)
        const { segment } = testObj1
        expect(dispatchSpy).toHaveBeenCalledWith(
          viewerStateSetSelectedRegions({
            selectRegions: [segment]
          } as any)
        )
      })
      it('> fallback called (does not intercept)', () => {
        TestBed.createComponent(NehubaGlueCmp)
        clickIntServ.callRegFns(null)
        expect(fallbackSpy).toHaveBeenCalled()
      })
    })
  })

  describe('> handleFileDrop', () => {
    let addNgLayerSpy: jasmine.Spy
    let removeNgLayersSpy: jasmine.Spy
    let workerSendMessageSpy: jasmine.Spy
    let dummyFile1: File
    let dummyFile2: File
    let input: File[]

    beforeEach(() => {
      dummyFile1 = (() => {
        const bl: any = new Blob([], { type: 'text' })
        bl.name = 'filename1.txt'
        bl.lastModifiedDate = new Date()
        return bl as File
      })()

      dummyFile2 = (() => {
        const bl: any = new Blob([], { type: 'text' })
        bl.name = 'filename2.txt'
        bl.lastModifiedDate = new Date()
        return bl as File
      })()

      fixture = TestBed.createComponent(NehubaGlueCmp)
      fixture.detectChanges()

      addNgLayerSpy = spyOn(fixture.componentInstance['layerCtrlService'], 'addNgLayer').and.callFake(() => {

      })
      removeNgLayersSpy = spyOn(fixture.componentInstance['layerCtrlService'], 'removeNgLayers').and.callFake(() => {

      })

      workerSendMessageSpy = spyOn(fixture.componentInstance['worker'], 'sendMessage').and.callFake(async () => {
        return {
          result: {
            meta: {}, buffer: null
          }
        }
      })
    })
    afterEach(() => {
      addNgLayerSpy.calls.reset()
      removeNgLayersSpy.calls.reset()
      workerSendMessageSpy.calls.reset()
    })

    describe('> malformed input', () => {
      const scenarios = [{
        desc: 'too few files',
        inp: []
      }, {
        desc: 'too many files',
        inp: [dummyFile1, dummyFile2]
      }]

      for (const { desc, inp } of scenarios) {
        describe(`> ${desc}`, () => {
          beforeEach(() => {
            input = inp

            const cmp = fixture.componentInstance
            cmp.handleFileDrop(input)
          })

          it('> should not call addnglayer', () => {
            expect(removeNgLayersSpy).not.toHaveBeenCalled()
            expect(addNgLayerSpy).not.toHaveBeenCalled()
          })

          // TODO having a difficult time getting snackbar harness
          // it('> snackbar should show error message', async () => {
          //   console.log('get harness')

          //   rootLoader = TestbedHarnessEnvironment.documentRootLoader(fixture)
          //   const loader = TestbedHarnessEnvironment.loader(fixture)
          //   fixture.detectChanges()
          //   const snackbarHarness = await rootLoader.getHarness(MatSnackBarHarness)
          //   console.log('got harness', snackbarHarness)
          //   // const message = await snackbarHarness.getMessage()
          //   // console.log('got message')
          //   // expect(message).toEqual(INVALID_FILE_INPUT)
          // })
        })
      }
    })

    describe('> correct input', () => {
      beforeEach(async () => {
        input = [dummyFile1]

        const cmp = fixture.componentInstance
        await cmp.handleFileDrop(input)
      })

      afterEach(() => {
        // remove remove all urls
        fixture.componentInstance['dismissAllAddedLayers']()
      })

      it('> should call addNgLayer', () => {
        expect(removeNgLayersSpy).not.toHaveBeenCalled()
        expect(addNgLayerSpy).toHaveBeenCalledTimes(1)
      })
      it('> on repeated input, both remove nglayer and remove ng layer called', async () => {
        const cmp = fixture.componentInstance
        await cmp.handleFileDrop(input)

        expect(removeNgLayersSpy).toHaveBeenCalledTimes(1)
        expect(addNgLayerSpy).toHaveBeenCalledTimes(2)
      })
    })
  })
})
