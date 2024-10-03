import { ComponentFixture, TestBed } from "@angular/core/testing"
import { CommonModule } from "@angular/common"
import { AngularMaterialModule } from "src/sharedModules"
import { StatusCardComponent } from "./statusCard.component"
import { Directive, Component } from "@angular/core"
import { NEVER, of } from "rxjs"
import { ShareModule } from "src/share"
import { StateModule } from "src/state"
import { MockStore, provideMockStore } from "@ngrx/store/testing"
import { NoopAnimationsModule } from "@angular/platform-browser/animations"
import { FormsModule, ReactiveFormsModule } from "@angular/forms"
import { UtilModule } from "src/util"
import { NEHUBA_CONFIG_SERVICE_TOKEN } from "../config.service"
import { QuickTourModule } from "src/ui/quickTour/module";
import { atlasSelection } from "src/state"
import { SxplrTemplate } from "src/atlasComponents/sapi/sxplrTypes"
import { NEHUBA_INSTANCE_INJTKN } from "../util"
import { MediaQueryDirective } from "src/util/directives/mediaQuery.directive"
import { InterSpaceCoordXformSvc } from "src/atlasComponents/sapi/core/space/interSpaceCoordXform.service"

const mockNehubaConfig = {
  dataset: {
    initialNgState: {
      navigation: {
        pose: {
          orientation: [0, 0, 0, 1],
          position: [0, 0, 0]
        },
        zoomFactor: 1e6
      }
    }
  }
} as any

@Directive({
  selector: '[iav-auth-auth-state]',
  exportAs: 'iavAuthAuthState'
})

class MockIavAuthState{
  user$ = of(null)
}

@Component({
  selector: 'signin-modal',
  template: '',
})

class MockSigninModal{}

describe('> statusCard.component.ts', () => {
  let getNavigationStateFromConfigSpy: jasmine.Spy = jasmine.createSpy('getNavigationStateFromConfig').and.returnValue(mockNehubaConfig)
  describe('> StatusCardComponent', () => {
    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [
          CommonModule,
          AngularMaterialModule,
          ShareModule,
          StateModule,
          FormsModule,
          ReactiveFormsModule,
          NoopAnimationsModule,
          UtilModule,
          QuickTourModule,
          MediaQueryDirective,
        ],
        declarations: [
          StatusCardComponent,
          MockIavAuthState,
          MockSigninModal,
        ],
        providers: [
          provideMockStore({
            initialState: {
              viewerState: {
                fetchedTemplates: []
              }
            }
          }),
          {
            provide: NEHUBA_CONFIG_SERVICE_TOKEN,
            useValue: {
              getNehubaConfig: getNavigationStateFromConfigSpy
            }
          },
          {
            provide: NEHUBA_INSTANCE_INJTKN,
            useValue: NEVER
          },
          {
            provide: InterSpaceCoordXformSvc,
            useValue: {
              TmplIdToValidSpaceName() {throw new Error()},
              transform(){ throw new Error() }
            }
          }
        ]
      }).compileComponents()
    })

    beforeEach(() => {

      const mockStore = TestBed.inject(MockStore)

      mockStore.overrideSelector(atlasSelection.selectors.selectedTemplate, {
        id: 'minds/core/referencespace/v1.0.0/a1655b99-82f1-420f-a3c2-fe80fd4c8588',
        name: 'foo'
      } as SxplrTemplate)

    })

    it('> can be instantiated', () => {
      const fixture = TestBed.createComponent(StatusCardComponent)
      expect(fixture.debugElement.nativeElement).toBeTruthy()
    })

    describe('> in full mode, UIs are visible', () => {
      let fixture: ComponentFixture<StatusCardComponent>

      beforeEach(() => {

        fixture = TestBed.createComponent(StatusCardComponent)
        fixture.detectChanges()
        fixture.componentInstance.showFull = true
        fixture.detectChanges()
      })

      describe('> textNavigationTo', () => {
        it('> takes into account of statusPanelRealSpace panel', () => {
          const setNavigationStateSpy = jasmine.createSpy('setNavigationState')
          fixture.componentInstance.nehubaViewer = {
            setNavigationState: setNavigationStateSpy,
          } as any

          fixture.componentInstance.textNavigateTo('1, 0, 0')
          expect(setNavigationStateSpy).toHaveBeenCalledWith({
            position: [1e6, 0, 0],
            positionReal: true
          })
        })
      })
    })

    describe('> resetNavigation', () => {
      let fixture: ComponentFixture<StatusCardComponent>
      const mockCurrNavigation = {
        orientation: [1,0,0,0],
        position: [100,200,300],
        perspectiveZoom: 1e9,
        zoom: 1e9,
        perspectiveOrientation: [1,0,0,0]
      }

      

      beforeEach(() => {
        const mockStore = TestBed.inject(MockStore)
        mockStore.overrideSelector(atlasSelection.selectors.selectedTemplate, null)
        mockStore.overrideSelector(atlasSelection.selectors.navigation, mockCurrNavigation)
        
        
        fixture = TestBed.createComponent(StatusCardComponent)
        fixture.detectChanges()
        fixture.componentInstance.showFull = true
        fixture.detectChanges()
      })

      for (const method of ['rotation', 'position', 'zoom' ]) {
        describe(`> method: ${method}`, () => {

          it(`> resetNavigation call calls getNavigationStateFromConfig`, () => {
            fixture.componentInstance.resetNavigation({ [method]: true,  })
            fixture.detectChanges()
            expect(getNavigationStateFromConfigSpy).toHaveBeenCalled()
          })

          it('> resetNavigation dispatches correct action', () => {

            const mockStore = TestBed.inject(MockStore)
            const idspatchSpy = spyOn(mockStore, 'dispatch')
            fixture.componentInstance.resetNavigation({ [method]: true,  })
            fixture.detectChanges()

            const overrideObj = {}
            if (method === 'rotation') overrideObj['orientation'] = mockNehubaConfig.dataset.initialNgState.navigation.pose.orientation
            if (method === 'position') overrideObj['position'] = mockNehubaConfig.dataset.initialNgState.navigation.pose.position
            if (method === 'zoom') overrideObj['zoom'] = mockNehubaConfig.dataset.initialNgState.navigation.zoomFactor
            expect(idspatchSpy).toHaveBeenCalledWith(
              atlasSelection.actions.navigateTo({
                navigation: {
                  ...mockCurrNavigation,
                  ...overrideObj,
                },
                physical: true,
                animation: true
              })
            )
          })
        })
      }
    })


  })
})
