import { CommonModule } from "@angular/common"
import { Component } from "@angular/core"
import { TestBed, async, ComponentFixture } from "@angular/core/testing"
import { By } from "@angular/platform-browser"
import { BrowserDynamicTestingModule } from "@angular/platform-browser-dynamic/testing"
import { MockStore, provideMockStore } from "@ngrx/store/testing"
import { ngViewerSelectorOctantRemoval } from "src/services/state/ngViewerState/selectors"
import { NehubaViewerUnit } from "../nehubaViewer/nehubaViewer.component"
import { NehubaViewerContainerDirective } from "./nehubaViewerInterface.directive"
import { viewerStateSelectorNavigation, viewerStateStandAloneVolumes } from "src/services/state/viewerState/selectors";
import { Subject } from "rxjs"
import { ngViewerActionNehubaReady } from "src/services/state/ngViewerState/actions"

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
        debouncedViewerPositionChange: new Subject(),
        layersChanged: new Subject(),
        nehubaReady: new Subject(),
        mouseoverSegmentEmitter: new Subject(),
        mouseoverLandmarkEmitter: new Subject(),
        mouseoverUserlandmarkEmitter: new Subject(),
        elementRef: {
          nativeElement: {}
        }
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
        const template = {        }
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
  })
})
