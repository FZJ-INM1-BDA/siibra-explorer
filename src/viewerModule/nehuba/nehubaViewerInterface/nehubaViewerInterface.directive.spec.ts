import { Component } from "@angular/core"
import { TestBed, async, ComponentFixture, fakeAsync, tick } from "@angular/core/testing"
import { By } from "@angular/platform-browser"
import { BrowserDynamicTestingModule } from "@angular/platform-browser-dynamic/testing"
import { MockStore, provideMockStore } from "@ngrx/store/testing"
import { ngViewerSelectorOctantRemoval } from "src/services/state/ngViewerState/selectors"
import { NehubaViewerUnit } from "../nehubaViewer/nehubaViewer.component"
import { NehubaViewerContainerDirective } from "./nehubaViewerInterface.directive"
import { viewerStateSelectorNavigation, viewerStateStandAloneVolumes } from "src/services/state/viewerState/selectors";
import { Subject } from "rxjs"
import { ngViewerActionNehubaReady } from "src/services/state/ngViewerState/actions"
import { viewerStateMouseOverCustomLandmarkInPerspectiveView } from "src/services/state/viewerState/actions"
import { selectViewerConfigAnimationFlag } from "src/services/state/viewerConfig/selectors"

describe('> nehubaViewerInterface.directive.ts', () => {
  describe('> NehubaViewerContainerDirective', () => {

    @Component({
      template: ''
    })
    class DummyCmp{}

    beforeEach(async(() => {
      TestBed.configureTestingModule({
        imports: [
          
        ],
        declarations: [
          NehubaViewerContainerDirective,
          DummyCmp,
          NehubaViewerUnit,
        ],
        providers: [
          provideMockStore({ initialState: {} })
        ]
      }).overrideModule(BrowserDynamicTestingModule,{
        set: {
          entryComponents: [
            NehubaViewerUnit
          ]
        }
      }).overrideComponent(DummyCmp, {
        set: {
          template: `
          <div iav-nehuba-viewer-container>
          </div>
          `
        }
      }).compileComponents()

    }))

    beforeEach(() => {
      const mockStore = TestBed.inject(MockStore)
      mockStore.overrideSelector(ngViewerSelectorOctantRemoval, true)
      mockStore.overrideSelector(viewerStateStandAloneVolumes, [])
      mockStore.overrideSelector(viewerStateSelectorNavigation, null)
      mockStore.overrideSelector(selectViewerConfigAnimationFlag, false)
    })

    it('> can be inited', () => {

      const fixture = TestBed.createComponent(DummyCmp)
      fixture.detectChanges()
      const directive = fixture.debugElement.query(
        By.directive(NehubaViewerContainerDirective)
      )

      expect(directive).toBeTruthy()
    })

    describe('> on createNehubaInstance', () => {
      let fixture: ComponentFixture<DummyCmp>
      let directiveInstance: NehubaViewerContainerDirective
      let nehubaViewerInstanceSpy: jasmine.Spy
      let elClearSpy: jasmine.Spy
      let elCreateComponentSpy: jasmine.Spy
      const spyNehubaViewerInstance = {
        config: null,
        lifecycle: null,
        templateId: null,
        errorEmitter: new Subject(),
        viewerPositionChange: new Subject(),
        layersChanged: new Subject(),
        nehubaReady: new Subject(),
        mouseoverSegmentEmitter: new Subject(),
        mouseoverLandmarkEmitter: new Subject(),
        mouseoverUserlandmarkEmitter: new Subject(),
        elementRef: {
          nativeElement: {}
        },
        toggleOctantRemoval: jasmine.createSpy()
      }
      const spyComRef = {
        destroy: jasmine.createSpy('destroy')
      }

      beforeEach(() => {
        fixture = TestBed.createComponent(DummyCmp)
        const directive = fixture.debugElement.query(
          By.directive(NehubaViewerContainerDirective)
        )
        
        directiveInstance = directive.injector.get(NehubaViewerContainerDirective)
        
        nehubaViewerInstanceSpy = spyOnProperty(directiveInstance, 'nehubaViewerInstance').and.returnValue(spyNehubaViewerInstance)
        elClearSpy = spyOn(directiveInstance['el'], 'clear')
        // casting return value to any is not perfect, but since only 2 methods and 1 property is used, it's a quick way 
        // rather than allow component to be created
        elCreateComponentSpy = spyOn(directiveInstance['el'], 'createComponent').and.returnValue(spyComRef as any)
      })

      describe('> on createNehubaInstance called', () => {
        const template = {}
        const lifecycle = {}
        it('> method el.clear gets called before el.createComponent', () => {
          directiveInstance.createNehubaInstance(template, lifecycle)
          expect(elClearSpy).toHaveBeenCalledBefore(elCreateComponentSpy)
        })

        it('> if viewerConfig has gpuLimit, gpuMemoryLimit will be in initialNgSTate', () => {
          template['nehubaConfig'] = {
            dataset: {
              initialNgState: {}
            }
          }
          directiveInstance['viewerConfig'] = {
            gpuLimit: 5e8
          }
          directiveInstance.createNehubaInstance(template, lifecycle)
          expect(
            directiveInstance.nehubaViewerInstance?.config?.dataset?.initialNgState?.gpuMemoryLimit
          ).toEqual(5e8)
          expect(
            directiveInstance.nehubaViewerInstance?.config?.dataset?.initialNgState?.gpuLimit
          ).toBeFalsy()
        })
      })
    
      describe('> on clear called', () => {
        it('> dispatches nehubaReady: false action', () => {
          const mockStore = TestBed.inject(MockStore)
          const mockStoreDispatchSpy = spyOn(mockStore, 'dispatch')
          directiveInstance.clear()
          expect(
            mockStoreDispatchSpy
          ).toHaveBeenCalledWith(
            ngViewerActionNehubaReady({
              nehubaReady: false
            })
          )
        })

        it('> iavNehubaViewerContainerViewerLoading emits false', () => {
          const emitSpy = spyOn(directiveInstance.iavNehubaViewerContainerViewerLoading, 'emit')
          directiveInstance.clear()
          expect(emitSpy).toHaveBeenCalledWith(false)
        })

        it('> elClear called', () => {
          directiveInstance.clear()
          expect(elClearSpy).toHaveBeenCalled()
        })
      })
    
    })
  
    describe('> subscription of nehuba instance', () => {
      describe('> mouseoverUserlandmarkEmitter', () => {
        let spyNehubaViewerInstance: any
        let dispatchSpy: jasmine.Spy
        let directiveInstance: NehubaViewerContainerDirective
        const template = {}
        const lifecycle = {}
        beforeEach(() => {

          spyNehubaViewerInstance = {
            config: null,
            lifecycle: null,
            templateId: null,
            errorEmitter: new Subject(),
            viewerPositionChange: new Subject(),
            layersChanged: new Subject(),
            nehubaReady: new Subject(),
            mouseoverSegmentEmitter: new Subject(),
            mouseoverLandmarkEmitter: new Subject(),
            mouseoverUserlandmarkEmitter: new Subject(),
            elementRef: {
              nativeElement: {}
            }
          }
          const mockStore = TestBed.inject(MockStore)
          dispatchSpy = spyOn(mockStore, 'dispatch')

          const fixture = TestBed.createComponent(DummyCmp)
          const directive = fixture.debugElement.query(
            By.directive(NehubaViewerContainerDirective)
          )
          
          const spyComRef = {
            destroy: jasmine.createSpy('destroy')
          }
          directiveInstance = directive.injector.get(NehubaViewerContainerDirective)
          spyOnProperty(directiveInstance, 'nehubaViewerInstance').and.returnValue(spyNehubaViewerInstance)
          spyOn(directiveInstance['el'], 'clear').and.callFake(() => {})
          spyOn(directiveInstance, 'clear').and.callFake(() => {})
          // casting return value to any is not perfect, but since only 2 methods and 1 property is used, it's a quick way 
          // rather than allow component to be created
          spyOn(directiveInstance['el'], 'createComponent').and.returnValue(spyComRef as any)

        })

        afterEach(() => {
          dispatchSpy.calls.reset()
        })
        it('> single null emits null', fakeAsync(() => {

          directiveInstance.createNehubaInstance(template, lifecycle)
          spyNehubaViewerInstance.mouseoverUserlandmarkEmitter.next(null)

          tick(200)
          expect(dispatchSpy).toHaveBeenCalledWith(
            viewerStateMouseOverCustomLandmarkInPerspectiveView({
              payload: { label: null }
            })
          )
        }))

        it('> single value emits value', fakeAsync(() => {

          directiveInstance.createNehubaInstance(template, lifecycle)
          spyNehubaViewerInstance.mouseoverUserlandmarkEmitter.next("24")

          tick(200)
          expect(dispatchSpy).toHaveBeenCalledWith(
            viewerStateMouseOverCustomLandmarkInPerspectiveView({
              payload: { label: "24" }
            })
          )
        }))

        describe('> double value in 140ms emits last value', () => {

          it('> null - 24 emits 24', fakeAsync(() => {

            directiveInstance.createNehubaInstance(template, lifecycle)
            spyNehubaViewerInstance.mouseoverUserlandmarkEmitter.next(null)
            spyNehubaViewerInstance.mouseoverUserlandmarkEmitter.next("24")
  
            tick(200)
            expect(dispatchSpy).toHaveBeenCalledWith(
              viewerStateMouseOverCustomLandmarkInPerspectiveView({
                payload: { label: "24" }
              })
            )
          }))
          it('> 24 - null emits null', fakeAsync(() => {

            directiveInstance.createNehubaInstance(template, lifecycle)
            spyNehubaViewerInstance.mouseoverUserlandmarkEmitter.next("24")
            spyNehubaViewerInstance.mouseoverUserlandmarkEmitter.next(null)
  
            tick(200)
            expect(dispatchSpy).toHaveBeenCalledWith(
              viewerStateMouseOverCustomLandmarkInPerspectiveView({
                payload: { label: null }
              })
            )
          }))
        })
      
        it('> single value outside 140 ms emits separately', fakeAsync(() => {

          directiveInstance.createNehubaInstance(template, lifecycle)
          spyNehubaViewerInstance.mouseoverUserlandmarkEmitter.next(null)
          tick(200)
          spyNehubaViewerInstance.mouseoverUserlandmarkEmitter.next("24")

          tick(200)
          expect(
            dispatchSpy.calls.allArgs()
          ).toEqual([
            [
              viewerStateMouseOverCustomLandmarkInPerspectiveView({
                payload: { label: null }
              })
            ],
            [
              viewerStateMouseOverCustomLandmarkInPerspectiveView({
                payload: { label: "24" }
              })
            ]
          ])
        }))
      })
    })
  })
})
