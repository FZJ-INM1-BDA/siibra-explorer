import { CommonModule } from "@angular/common"
import { ChangeDetectorRef, Component, ComponentRef, EventEmitter, NgModule } from "@angular/core"
import { async, TestBed } from "@angular/core/testing"
import { By } from "@angular/platform-browser"
import { RegionalFeaturesService } from "../regionalFeature.service"
import { ISingleFeature } from "../singleFeatures/interfaces"
import { FeatureContainer } from "./featureContainer.component"

const dummyCmpType = 'dummyType'

@Component({
  template: `{{ text }}`
})

class DummyComponent implements ISingleFeature{
  text = 'hello world'
  feature: any
  region: any
  viewChanged = new EventEmitter<boolean>()
}

@Component({
  template: ''
})

class HostCmp{
  public feature: any
  public region: any

  constructor(public cdr: ChangeDetectorRef){

  }

  detectChange(){
    this.cdr.detectChanges()
  }
}

const serviceStub = {
  mapFeatToCmp: new Map([
    [dummyCmpType, DummyComponent]
  ])
}

describe('> featureContainer.component.ts', () => {
  describe('> FeatureContainer', () => {

    beforeEach(async () => {

      await TestBed.configureTestingModule({
        imports: [
          CommonModule,
        ],
        declarations: [
          FeatureContainer,
          DummyComponent,
          HostCmp,
        ],
        providers: [
          {
            provide: RegionalFeaturesService,
            useValue: serviceStub
          }
        ]
      }).overrideComponent(HostCmp, {
        set: {
          template: `
          <feature-container
            [feature]="feature"
            [region]="region"
            (viewChanged)="detectChange()">
          </feature-container>`
        }
      }).compileComponents()

    })

    it('> can be created', () => {
      const fixture = TestBed.createComponent(HostCmp)
      expect(fixture).toBeTruthy()
      const featContainer = fixture.debugElement.query(By.directive(FeatureContainer))
      expect(featContainer).toBeTruthy()
    })

    describe('> if inputs change', () => {
      it('> if input changed, but feature is not one of them, map.get will not be called', () => {
        const fixture = TestBed.createComponent(HostCmp)
        // const featContainer = fixture.debugElement.query(By.directive(FeatureContainer))
        spyOn(serviceStub.mapFeatToCmp, 'get').and.callThrough()
        fixture.componentInstance.region = {
          name: 'tesla'
        }
        fixture.detectChanges()
        expect(serviceStub.mapFeatToCmp.get).not.toHaveBeenCalled()
      })

      it('> if input changed, feature is one of them, will not call map.get', () => {
        const fixture = TestBed.createComponent(HostCmp)
        const dummyFeature = {
          type: dummyCmpType
        }
        spyOn(serviceStub.mapFeatToCmp, 'get').and.callThrough()
        fixture.componentInstance.feature = dummyFeature
        fixture.detectChanges()
        expect(serviceStub.mapFeatToCmp.get).toHaveBeenCalledWith(dummyCmpType)
      })

      it('> should render default txt', () => {
        const fixture = TestBed.createComponent(HostCmp)
        const dummyFeature = {
          type: dummyCmpType
        }
        fixture.componentInstance.feature = dummyFeature
        fixture.detectChanges()
        const text = fixture.nativeElement.textContent
        expect(text).toContain('hello world')
      })

      it('> if inner component changes, if view changed does not emit, will not change ui', () => {

        const fixture = TestBed.createComponent(HostCmp)
        const dummyFeature = {
          type: dummyCmpType
        }
        fixture.componentInstance.feature = dummyFeature
        fixture.detectChanges()
        const featureContainer = fixture.debugElement.query(
          By.directive(FeatureContainer)
        )
        const cr = (featureContainer.componentInstance as FeatureContainer)['cr'] as ComponentRef<DummyComponent>
        cr.instance.text = 'foo bar'
        const text = fixture.nativeElement.textContent
        expect(text).toContain('hello world')
      })

      it('> if inner component changes, and viewChanged is emitted, ui should change accordingly', () => {

        const fixture = TestBed.createComponent(HostCmp)
        const dummyFeature = {
          type: dummyCmpType
        }
        fixture.componentInstance.feature = dummyFeature
        fixture.detectChanges()
        const featureContainer = fixture.debugElement.query(
          By.directive(FeatureContainer)
        )
        const cr = (featureContainer.componentInstance as FeatureContainer)['cr'] as ComponentRef<DummyComponent>
        cr.instance.text = 'foo bar'
        cr.instance.viewChanged.emit(true)
        const text = fixture.nativeElement.textContent
        expect(text).toContain('foo bar')
      })
    })
  })
})
