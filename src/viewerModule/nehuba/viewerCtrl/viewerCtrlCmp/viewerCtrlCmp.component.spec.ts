import { CommonModule } from "@angular/common"
import { ComponentFixture, TestBed } from "@angular/core/testing"
import { FormsModule, ReactiveFormsModule } from "@angular/forms"
import { MockStore, provideMockStore } from "@ngrx/store/testing"
import { BehaviorSubject } from "rxjs"
import { ComponentsModule } from "src/components"
import { AngularMaterialModule } from "src/sharedModules"
import { UtilModule } from "src/util"
import { actionSetAuxMeshes, selectorAuxMeshes } from "../../store"
import { NEHUBA_INSTANCE_INJTKN } from "../../util"
import { ViewerCtrlCmp } from "./viewerCtrlCmp.component"
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed'
import { HarnessLoader } from "@angular/cdk/testing"
import { MatSlideToggleHarness } from "src/sharedModules/angularMaterial.exports"
import { atlasAppearance, atlasSelection, userPreference } from "src/state"
import { ExperimentalFlagDirective } from "src/experimental/experimental-flag.directive"
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core"


describe('> viewerCtrlCmp.component.ts', () => {
  describe('> ViewerCtrlCmp', () => {
    let fixture: ComponentFixture<ViewerCtrlCmp>
    let loader: HarnessLoader
    let mockStore: MockStore
    let dispatchSpy: jasmine.Spy

    let mockNehubaViewer = {
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
          ExperimentalFlagDirective,
        ],
        declarations: [ ViewerCtrlCmp ],
        schemas: [
          CUSTOM_ELEMENTS_SCHEMA
        ],
        providers: [
          provideMockStore(),
          {
            provide: NEHUBA_INSTANCE_INJTKN,
            useFactory: () => {
              return new BehaviorSubject(mockNehubaViewer).asObservable()
            }
          },
        ]
      }).compileComponents()


    })
    beforeEach(() => {
      mockStore = TestBed.inject(MockStore)
      
      dispatchSpy = spyOn(mockStore, "dispatch").and.callThrough()
      mockStore.overrideSelector(atlasSelection.selectors.selectedTemplate, {} as any)
      mockStore.overrideSelector(atlasAppearance.selectors.octantRemoval, true)
      mockStore.overrideSelector(atlasAppearance.selectors.meshTransparency, 1)
      mockStore.overrideSelector(userPreference.selectors.showExperimental, true)
      
      mockStore.overrideSelector(atlasAppearance.selectors.showAllSegMeshes, false)
      mockStore.overrideSelector(selectorAuxMeshes, [])
    })

    afterEach(() => {
      dispatchSpy.calls.reset()
    })

    describe('> can be init', () => {

      beforeEach(() => {
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

        it('> toggleslider should exist', async () => {
          const slideToggle = await loader.getAllHarnesses(
            MatSlideToggleHarness.with({
              name: toggleName,
            })
          )
          expect(slideToggle.length).toBe(1)
        })
  
        it('> toggling it should result in action dispatched', async () => {
          const slideToggle = await loader.getAllHarnesses(
            MatSlideToggleHarness.with({
              name: toggleName,
            })
          )
          await slideToggle[0].toggle()
          
          expect(dispatchSpy).toHaveBeenCalledWith(atlasAppearance.actions.toggleOctantRemoval())
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
  })
})
