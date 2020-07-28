import { async, TestBed } from "@angular/core/testing"
import { CommonModule } from "@angular/common"
import { AngularMaterialModule } from "src/ui/sharedModules/angularMaterial.module"
import { StatusCardComponent } from "./statusCard.component"
import { Directive, Component } from "@angular/core"
import { of } from "rxjs"
import { ShareModule } from "src/share"
import { StateModule } from "src/state"
import { provideMockStore } from "@ngrx/store/testing"
import { By } from "@angular/platform-browser"
import { MatSlideToggle } from "@angular/material/slide-toggle"
import { NoopAnimationsModule } from "@angular/platform-browser/animations"
import { FormsModule, ReactiveFormsModule } from "@angular/forms"

@Directive({
  selector: '[iav-auth-authState]',
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
    it('> can be instantiated', () => {
      const fixture = TestBed.createComponent(StatusCardComponent)
      expect(fixture.debugElement.nativeElement).toBeTruthy()
    })

    it('> toggle can be found', () => {
      
      const fixture = TestBed.createComponent(StatusCardComponent)
      fixture.detectChanges()
      const slider = fixture.debugElement.query( By.directive(MatSlideToggle) )
      expect(slider).toBeTruthy()
    })

    it('> toggling voxel/real toggle also toggles statusPanelRealSpace flag', () => {

      const fixture = TestBed.createComponent(StatusCardComponent)
      fixture.detectChanges()
      const prevFlag = fixture.componentInstance.statusPanelRealSpace
      const sliderEl = fixture.debugElement.query( By.directive(MatSlideToggle) )
      const slider = sliderEl.injector.get(MatSlideToggle)
      slider.toggle()
      fixture.detectChanges()
      expect(fixture.componentInstance.statusPanelRealSpace).toEqual(!prevFlag)
    })

    describe('> textNavigationTo', () => {
      it('> takes into account of statusPanelRealSpace panel', () => {
        const fixture = TestBed.createComponent(StatusCardComponent)
        fixture.detectChanges()
        const setNavigationStateSpy = jasmine.createSpy('setNavigationState')
        fixture.componentInstance.nehubaViewer = {
          setNavigationState: setNavigationStateSpy
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
})
