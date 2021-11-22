import { CommonModule } from "@angular/common"
import { ComponentFixture, TestBed } from "@angular/core/testing"
import { FormsModule, ReactiveFormsModule } from "@angular/forms"
import { MockStore, provideMockStore } from "@ngrx/store/testing"
import { BehaviorSubject, of } from "rxjs"
import { ComponentsModule } from "src/components"
import { ngViewerSelectorOctantRemoval } from "src/services/state/ngViewerState.store.helper"
import { viewerStateCustomLandmarkSelector, viewerStateSelectedTemplatePureSelector } from "src/services/state/viewerState/selectors"
import { AngularMaterialModule } from "src/sharedModules"
import {PureContantService, UtilModule} from "src/util"
import { actionSetAuxMeshes, selectorAuxMeshes } from "../../store"
import { NEHUBA_INSTANCE_INJTKN } from "../../util"
import { ViewerCtrlCmp } from "./viewerCtrlCmp.component"
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed'
import { HarnessLoader } from "@angular/cdk/testing"
import { MatSlideToggleHarness } from '@angular/material/slide-toggle/testing'

describe('> viewerCtrlCmp.component.ts', () => {
  describe('> ViewerCtrlCmp', () => {
    let fixture: ComponentFixture<ViewerCtrlCmp>
    let loader: HarnessLoader
    let mockStore: MockStore

    let mockNehubaViewer = {
      updateUserLandmarks: jasmine.createSpy(),
      nehubaViewer: {
        ngviewer: {
          layerManager: {
            getLayerByName: jasmine.createSpy('getLayerByName'),
            get managedLayers() {
              return []
            },
            set managedLayers(val) {
              return
            }
          },
          display: {
            scheduleRedraw: jasmine.createSpy('scheduleRedraw')
          }
        }
      }
    }

    afterEach(() => {
      mockNehubaViewer.updateUserLandmarks.calls.reset()
      mockNehubaViewer.nehubaViewer.ngviewer.layerManager.getLayerByName.calls.reset()
      mockNehubaViewer.nehubaViewer.ngviewer.display.scheduleRedraw.calls.reset()
    })

    beforeEach( async () => {
      await TestBed.configureTestingModule({
        imports: [
          CommonModule,
          AngularMaterialModule,
          FormsModule,
          ReactiveFormsModule,
          ComponentsModule,
          UtilModule,
        ],
        declarations: [ ViewerCtrlCmp ],
        providers: [
          provideMockStore(),
          {
            provide: NEHUBA_INSTANCE_INJTKN,
            useFactory: () => {
              return new BehaviorSubject(mockNehubaViewer).asObservable()
            }
          },
          {
            provide: PureContantService,
            useFactory: () => {
              return {
                getViewerConfig: jasmine.createSpy('getViewerConfig')
              }
            }
          }
        ]
      }).compileComponents()

    })
    beforeEach(() => {
      mockStore = TestBed.inject(MockStore)
      mockStore.overrideSelector(viewerStateSelectedTemplatePureSelector, {})
      mockStore.overrideSelector(ngViewerSelectorOctantRemoval, true)
      mockStore.overrideSelector(viewerStateCustomLandmarkSelector, [])
    })

    describe('> can be init', () => {

      beforeEach(() => {
        mockStore.overrideSelector(selectorAuxMeshes, [])
        fixture = TestBed.createComponent(ViewerCtrlCmp)
        fixture.detectChanges()
        loader = TestbedHarnessEnvironment.loader(fixture)
      })
  
      it('> can be inst', () => {
        expect(fixture).toBeTruthy()
      })
    })

    describe('> UI', () => {

      beforeEach(() => {
        mockStore.overrideSelector(selectorAuxMeshes, [])
        fixture = TestBed.createComponent(ViewerCtrlCmp)
        fixture.detectChanges()
        loader = TestbedHarnessEnvironment.loader(fixture)
      })

      describe('> octant removal', () => {
        const toggleName = 'remove-frontal-octant'
        let setOctantRemovalSpy: jasmine.Spy
        beforeEach(() => {
          setOctantRemovalSpy = spyOn(fixture.componentInstance, 'setOctantRemoval')
        })
        afterEach(() => {
          setOctantRemovalSpy.calls.reset()
        })
  
        it('> toggleslider should exist', async () => {
          const slideToggle = await loader.getAllHarnesses(
            MatSlideToggleHarness.with({
              name: toggleName,
            })
          )
          expect(slideToggle.length).toBe(1)
        })
  
        it('> toggling it should result in setOctantRemoval to be called', async () => {
          const slideToggle = await loader.getAllHarnesses(
            MatSlideToggleHarness.with({
              name: toggleName,
            })
          )
          const wasChecked = await slideToggle[0].isChecked()
          await slideToggle[0].toggle()
          expect(
            setOctantRemovalSpy
          ).toHaveBeenCalledWith(!wasChecked)
        })
      })
  
      describe('> toggle delineation', () => {
        
        let toggleDelination: jasmine.Spy
        const toggleName = 'toggle-delineation'
        beforeEach(() => {
          toggleDelination = spyOn<any>(fixture.componentInstance, 'toggleParcVsbl')
        })
        afterEach(() => {
          toggleDelination.calls.reset()
        })
  
        it('> toggleslider should exist', async () => {
          const slideToggle = await loader.getAllHarnesses(
            MatSlideToggleHarness.with({
              name: toggleName,
            })
          )
          expect(slideToggle.length).toBe(1)
        })
  
        it('> toggling it should result in setOctantRemoval to be called', async () => {
          const slideToggle = await loader.getAllHarnesses(
            MatSlideToggleHarness.with({
              name: toggleName,
            })
          )
          await slideToggle[0].toggle()
          expect(
            toggleDelination
          ).toHaveBeenCalled()
        })
      })
    })

    describe('> UI aux meshes', () => {
      const id = 'test-1-id'
      const name = `toggle-aux-mesh-${id}`
      const auxMesh = {
        '@id': id,
        labelIndicies: [1,2,3],
        name: 'test-1-name',
        ngId: 'test-1-ng-id',
        rgb: [255, 255, 255] as [number, number, number] , 
        visible: true,
      }
      const auxMesh2 = {
        '@id': 'foo-bar',
        labelIndicies: [3,4,5],
        name: 'test-2-name',
        ngId: 'test-2-ng-id',
        rgb: [100, 100, 100] as [number, number, number] , 
        visible: true,
      }
      beforeEach(() => {
        mockStore.overrideSelector(selectorAuxMeshes, [
          auxMesh,
          auxMesh2
        ])
        fixture = TestBed.createComponent(ViewerCtrlCmp)
        fixture.detectChanges()
        loader = TestbedHarnessEnvironment.loader(fixture)
      })
      it('> toggleslider should exist', async () => {
        const slideToggle = await loader.getAllHarnesses(
          MatSlideToggleHarness.with({
            name
          })
        )
        expect(slideToggle.length).toBe(1)
      })

      it('> toggling it should call dispatch', async () => {
        const dispatchSpy = spyOn(mockStore, 'dispatch')

        const slideToggle = await loader.getAllHarnesses(
          MatSlideToggleHarness.with({
            name
          })
        )
        await slideToggle[0].toggle()
        expect(
          dispatchSpy
        ).toHaveBeenCalledWith(
          actionSetAuxMeshes({
            payload: [
              {
                ...auxMesh,
                visible: !auxMesh.visible
              },
              auxMesh2
            ]
          })
        )
      })
    })

    describe('> flagDelin', () => {
      let toggleParcVsblSpy: jasmine.Spy
      beforeEach(() => {
        fixture = TestBed.createComponent(ViewerCtrlCmp)
        toggleParcVsblSpy = spyOn(fixture.componentInstance as any, 'toggleParcVsbl')
        fixture.detectChanges()
      })
      it('> calls toggleParcVsbl', () => {
        toggleParcVsblSpy.and.callFake(() => {})
        fixture.componentInstance.flagDelin = false
        expect(toggleParcVsblSpy).toHaveBeenCalled()
      })
    })
    describe('> toggleParcVsbl', () => {
      let getViewerConfigSpy: jasmine.Spy
      let getLayerByNameSpy: jasmine.Spy
      beforeEach(() => {
        const pureCstSvc = TestBed.inject(PureContantService)
        getLayerByNameSpy = mockNehubaViewer.nehubaViewer.ngviewer.layerManager.getLayerByName
        getViewerConfigSpy = pureCstSvc.getViewerConfig as jasmine.Spy
        fixture = TestBed.createComponent(ViewerCtrlCmp)
        fixture.detectChanges()
      })

      it('> calls pureSvc.getViewerConfig', async () => {
        getViewerConfigSpy.and.returnValue({})
        await fixture.componentInstance['toggleParcVsbl']()
        expect(getViewerConfigSpy).toHaveBeenCalled()
      })

      describe('> if _flagDelin is true', () => {
        beforeEach(() => {
          fixture.componentInstance['_flagDelin'] = true
          fixture.componentInstance['hiddenLayerNames'] = [
            'foo',
            'bar',
            'baz'
          ]
        })
        it('> go through all hideen layer names and set them to true', async () => {
          const setVisibleSpy = jasmine.createSpy('setVisible')
          getLayerByNameSpy.and.returnValue({
            setVisible: setVisibleSpy
          })
          await fixture.componentInstance['toggleParcVsbl']()
          expect(getLayerByNameSpy).toHaveBeenCalledTimes(3)
          for (const arg of ['foo', 'bar', 'baz']) {
            expect(getLayerByNameSpy).toHaveBeenCalledWith(arg)
          }
          expect(setVisibleSpy).toHaveBeenCalledTimes(3)
          expect(setVisibleSpy).toHaveBeenCalledWith(true)
          expect(setVisibleSpy).not.toHaveBeenCalledWith(false)
        })
        it('> hiddenLayerNames resets', async () => {
          await fixture.componentInstance['toggleParcVsbl']()
          expect(fixture.componentInstance['hiddenLayerNames']).toEqual([])
        })
      })

      describe('> if _flagDelin is false', () => {
        let managedLayerSpyProp: jasmine.Spy
        let setVisibleSpy: jasmine.Spy
        beforeEach(() => {
          fixture.componentInstance['_flagDelin'] = false
          setVisibleSpy = jasmine.createSpy('setVisible')
          getLayerByNameSpy.and.returnValue({
            setVisible: setVisibleSpy
          })
          getViewerConfigSpy.and.resolveTo({
            'foo': {},
            'bar': {},
            'baz': {}
          })
          managedLayerSpyProp = spyOnProperty(mockNehubaViewer.nehubaViewer.ngviewer.layerManager, 'managedLayers')
          managedLayerSpyProp.and.returnValue([{
            visible: true,
            name: 'foo'
          }, {
            visible: false,
            name: 'bar'
          }, {
            visible: true,
            name: 'baz'
          }])
        })

        afterEach(() => {
          managedLayerSpyProp.calls.reset()
        })

        it('> calls schedulRedraw', async () => {
          await fixture.componentInstance['toggleParcVsbl']()
          await new Promise(rs => requestAnimationFrame(rs))
          expect(mockNehubaViewer.nehubaViewer.ngviewer.display.scheduleRedraw).toHaveBeenCalled()
        })

        it('> only calls setVisible false on visible layers', async () => {
          await fixture.componentInstance['toggleParcVsbl']()
          expect(getLayerByNameSpy).toHaveBeenCalledTimes(2)
          
          for (const arg of ['foo', 'baz']) {
            expect(getLayerByNameSpy).toHaveBeenCalledWith(arg)
          }
          expect(setVisibleSpy).toHaveBeenCalledTimes(2)
          expect(setVisibleSpy).toHaveBeenCalledWith(false)
          expect(setVisibleSpy).not.toHaveBeenCalledWith(true)
        })

        it('> sets hiddenLayerNames correctly', async () => {
          await fixture.componentInstance['toggleParcVsbl']()
          expect(fixture.componentInstance['hiddenLayerNames']).toEqual(['foo', 'baz'])
        })
      })
    })
  })
})
