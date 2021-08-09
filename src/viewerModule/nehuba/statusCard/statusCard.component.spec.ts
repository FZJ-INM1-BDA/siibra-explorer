import { async, ComponentFixture, TestBed } from "@angular/core/testing"
import { CommonModule } from "@angular/common"
import { AngularMaterialModule } from "src/sharedModules"
import { StatusCardComponent } from "./statusCard.component"
import { Directive, Component } from "@angular/core"
import { Observable, of } from "rxjs"
import { ShareModule } from "src/share"
import { StateModule } from "src/state"
import { MockStore, provideMockStore } from "@ngrx/store/testing"
import { By } from "@angular/platform-browser"
import { MatSlideToggle } from "@angular/material/slide-toggle"
import { NoopAnimationsModule } from "@angular/platform-browser/animations"
import { FormsModule, ReactiveFormsModule } from "@angular/forms"
import { UtilModule } from "src/util"
import { viewerConfigSelectorUseMobileUi } from "src/services/state/viewerConfig.store.helper"
import { viewerStateNavigationStateSelector, viewerStateSelectedTemplatePureSelector } from "src/services/state/viewerState/selectors"
import * as util from '../util'
import { viewerStateChangeNavigation } from "src/services/state/viewerState/actions"
import {QuickTourModule} from "src/ui/quickTour/module";

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
  describe('> StatusCardComponent', () => {
    beforeEach(async(() => {
      TestBed.configureTestingModule({
        imports: [
          CommonModule,
          AngularMaterialModule,
          ShareModule,
          StateModule,
          FormsModule,
          ReactiveFormsModule,
          NoopAnimationsModule,
          UtilModule,
          QuickTourModule
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
          })
        ]
      }).compileComponents()
    }))

    beforeEach(() => {

      const mockStore = TestBed.inject(MockStore)
      mockStore.overrideSelector(viewerConfigSelectorUseMobileUi, false)

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

      it('> toggle can be found', () => {

        const slider = fixture.debugElement.query( By.directive(MatSlideToggle) )
        expect(slider).toBeTruthy()
      })

      it('> toggling voxel/real toggle also toggles statusPanelRealSpace flag', () => {

        const prevFlag = fixture.componentInstance.statusPanelRealSpace
        const sliderEl = fixture.debugElement.query( By.directive(MatSlideToggle) )
        const slider = sliderEl.injector.get(MatSlideToggle)
        slider.toggle()
        fixture.detectChanges()
        expect(fixture.componentInstance.statusPanelRealSpace).toEqual(!prevFlag)
      })

      describe('> textNavigationTo', () => {
        it('> takes into account of statusPanelRealSpace panel', () => {
          const setNavigationStateSpy = jasmine.createSpy('setNavigationState')
          fixture.componentInstance.nehubaViewer = {
            setNavigationState: setNavigationStateSpy,
          } as any

          fixture.componentInstance.statusPanelRealSpace = true
          fixture.componentInstance.textNavigateTo('1, 0, 0')
          expect(setNavigationStateSpy).toHaveBeenCalledWith({
            position: [1e6, 0, 0],
            positionReal: true
          })

          fixture.componentInstance.statusPanelRealSpace = false
          fixture.componentInstance.textNavigateTo('1, 0, 0')
          expect(setNavigationStateSpy).toHaveBeenCalledWith({
            position: [1, 0, 0],
            positionReal: false
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

      const mockNavState = {
        orientation: [0,0,0,1],
        position: [10,20,30],
        perspectiveZoom: 1e6,
        zoom: 1e6,
        perspectiveOrientation: [0,0,0,1]
      }
      const mockTemplate = { foo:'bar', nehubaConfig: { foo2: 'bar2' } }

      let getNavigationStateFromConfigSpy: jasmine.Spy = jasmine.createSpy('getNavigationStateFromConfig').and.returnValue(mockNavState)

      beforeEach(() => {
        const mockStore = TestBed.inject(MockStore)
        mockStore.overrideSelector(viewerStateSelectedTemplatePureSelector, mockTemplate)
        mockStore.overrideSelector(viewerStateNavigationStateSelector, mockCurrNavigation)

        spyOnProperty(util, 'getNavigationStateFromConfig').and.returnValue(getNavigationStateFromConfigSpy)

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
            if (method === 'rotation') overrideObj['orientation'] = mockNavState['orientation']
            if (method === 'position') overrideObj['position'] = mockNavState['position']
            if (method === 'zoom') overrideObj['zoom'] = mockNavState['zoom']
            expect(idspatchSpy).toHaveBeenCalledWith(
              viewerStateChangeNavigation({
                navigation: {
                  ...mockCurrNavigation,
                  ...overrideObj,
                  positionReal: false,
                  animation: {},
                }
              })
            )
          })
        })
      }
    })


  })
})
