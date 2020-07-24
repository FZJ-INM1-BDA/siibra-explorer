import { TestBed, async } from "@angular/core/testing"
import { RegionMenuComponent } from "./regionMenu.component"
import { AngularMaterialModule } from "src/ui/sharedModules/angularMaterial.module"
import { UtilModule } from "src/util/util.module"
import { CommonModule } from "@angular/common"
import { PreviewDatasetFile } from "src/ui/databrowserModule/singleDataset/datasetPreviews/previewDatasetFile.directive"
import { provideMockStore, MockStore } from "@ngrx/store/testing"
import { regionInOtherTemplateSelector, RenderViewOriginDatasetLabelPipe } from '../region.base'
import { ARIA_LABELS } from 'common/constants'
import { By } from "@angular/platform-browser"

const mt0 = {
  name: 'mt0'
}

const mt1 = {
  name: 'mt1'
}

const mr0 = {
  name: 'mr0'
}

const mr1 = {
  name: 'mr1'
}

const mp0 = {
  name: 'mp0'
}

const mp1 = {
  name: 'mp1'
}

const mrm0 = {
  template: mt0,
  parcellation: mp0,
  region: mr0
}

const mrm1 = {
  template: mt1,
  parcellation: mp1,
  region: mr1
}

const hemisphereMrms = [ {
  ...mrm0,
  hemisphere: 'left hemisphere'
}, {
  ...mrm1,
  hemisphere: 'left hemisphere'
} ]

const nohemisphereHrms = [mrm0, mrm1]

describe('> regionMenu.component.ts', () => {
  describe('> RegionMenuComponent', () => {
    beforeEach(async(() => {

      TestBed.configureTestingModule({
        imports: [
          UtilModule,
          AngularMaterialModule,
          CommonModule,
        ],
        declarations: [
          RegionMenuComponent,
          RenderViewOriginDatasetLabelPipe,
          /**
           * Used by regionMenu.template.html to show region preview
           */
          PreviewDatasetFile,
        ],
        providers: [
          provideMockStore({ initialState: {} })
        ]
      }).compileComponents()
      
    }))

    it('> init just fine', () => {
      const fixture = TestBed.createComponent(RegionMenuComponent)
      expect(fixture).toBeTruthy()
    })
    
    describe('> regionInOtherTemplatesTmpl', () => {

      it('> toggleBtn does not exists if selector returns empty array', () => {

        const mockStore = TestBed.inject(MockStore)
        mockStore.overrideSelector(
          regionInOtherTemplateSelector,
          []
        )

        const fixture = TestBed.createComponent(RegionMenuComponent)
        fixture.componentInstance.region = mr1
        fixture.detectChanges()

        const toggleBtn = fixture.debugElement.query( By.css(`[aria-label="${ARIA_LABELS.SHOW_IN_OTHER_REF_SPACE}"]`) )
        expect(toggleBtn).toBeFalsy()
      })

      it('> toggleBtn exists if selector returns non empty array', () => {

        const mockStore = TestBed.inject(MockStore)
        mockStore.overrideSelector(
          regionInOtherTemplateSelector,
          nohemisphereHrms
        )

        const fixture = TestBed.createComponent(RegionMenuComponent)
        fixture.componentInstance.region = mr1
        fixture.detectChanges()

        const toggleBtn = fixture.debugElement.query( By.css(`[aria-label="${ARIA_LABELS.SHOW_IN_OTHER_REF_SPACE}"]`) )
        expect(toggleBtn).toBeTruthy()
      })

      it('> if showRegionInOtherTmpl is set to false, toggle btn will not be shown', () => {
        
        const mockStore = TestBed.inject(MockStore)
        mockStore.overrideSelector(
          regionInOtherTemplateSelector,
          nohemisphereHrms
        )

        const fixture = TestBed.createComponent(RegionMenuComponent)
        fixture.componentInstance.region = mr1
        fixture.componentInstance.showRegionInOtherTmpl = false
        fixture.detectChanges()

        const toggleBtn = fixture.debugElement.query( By.css(`[aria-label="${ARIA_LABELS.SHOW_IN_OTHER_REF_SPACE}"]`) )
        expect(toggleBtn).toBeFalsy()
      })

      it('> even if toggleBtn exists, list should be hidden by default', () => {

        const mockStore = TestBed.inject(MockStore)
        mockStore.overrideSelector(
          regionInOtherTemplateSelector,
          nohemisphereHrms
        )

        const fixture = TestBed.createComponent(RegionMenuComponent)
        fixture.componentInstance.region = mr1
        fixture.detectChanges()

        const listContainer = fixture.debugElement.query( By.css(`[aria-label="${ARIA_LABELS.AVAILABILITY_IN_OTHER_REF_SPACE}"]`) )
        expect(listContainer).toBeFalsy()
      })

      it('> on click of toggle btn, list to become visible', () => {

        const mockStore = TestBed.inject(MockStore)
        mockStore.overrideSelector(
          regionInOtherTemplateSelector,
          nohemisphereHrms
        )

        const fixture = TestBed.createComponent(RegionMenuComponent)
        fixture.componentInstance.region = mr1
        fixture.detectChanges()
        const toggleBtn = fixture.debugElement.query( By.css(`[aria-label="${ARIA_LABELS.SHOW_IN_OTHER_REF_SPACE}"]`) )
        toggleBtn.triggerEventHandler('click', null)
        fixture.detectChanges()
        const listContainer = fixture.debugElement.query( By.css(`[aria-label="${ARIA_LABELS.AVAILABILITY_IN_OTHER_REF_SPACE}"]`) )
        expect(listContainer).toBeTruthy()
      })

      it('> once list becomes available, there should be 2 items on the list', () => {

        const mockStore = TestBed.inject(MockStore)
        mockStore.overrideSelector(
          regionInOtherTemplateSelector,
          nohemisphereHrms
        )

        const fixture = TestBed.createComponent(RegionMenuComponent)
        fixture.componentInstance.region = mr1
        fixture.detectChanges()
        const toggleBtn = fixture.debugElement.query( By.css(`[aria-label="${ARIA_LABELS.SHOW_IN_OTHER_REF_SPACE}"]`) )
        toggleBtn.triggerEventHandler('click', null)
        fixture.detectChanges()
        const listContainer = fixture.debugElement.query( By.css(`[aria-label="${ARIA_LABELS.AVAILABILITY_IN_OTHER_REF_SPACE}"]`) )
        expect(listContainer.nativeElement.children.length).toEqual(2)
      })

      it('> the text (no hemisphere metadata) on the list is as expected', () => {

        const mockStore = TestBed.inject(MockStore)
        mockStore.overrideSelector(
          regionInOtherTemplateSelector,
          nohemisphereHrms
        )

        const fixture = TestBed.createComponent(RegionMenuComponent)
        fixture.componentInstance.region = mr1
        fixture.detectChanges()
        const toggleBtn = fixture.debugElement.query( By.css(`[aria-label="${ARIA_LABELS.SHOW_IN_OTHER_REF_SPACE}"]`) )
        toggleBtn.triggerEventHandler('click', null)
        fixture.detectChanges()
        const listContainer = fixture.debugElement.query( By.css(`[aria-label="${ARIA_LABELS.AVAILABILITY_IN_OTHER_REF_SPACE}"]`) )

        // trim white spaces before and after
        const texts = Array.from(listContainer.nativeElement.children).map((c: HTMLElement) => c.textContent.replace(/^\s+/, '').replace(/\s+$/, ''))
        expect(texts).toContain(mt0.name)
        expect(texts).toContain(mt1.name)
      })

      it('> the text (with hemisphere metadata) on the list is as expected', () => {
        
        const mockStore = TestBed.inject(MockStore)
        mockStore.overrideSelector(
          regionInOtherTemplateSelector,
          hemisphereMrms
        )

        const fixture = TestBed.createComponent(RegionMenuComponent)
        fixture.componentInstance.region = mr1
        fixture.detectChanges()
        const toggleBtn = fixture.debugElement.query( By.css(`[aria-label="${ARIA_LABELS.SHOW_IN_OTHER_REF_SPACE}"]`) )
        toggleBtn.triggerEventHandler('click', null)
        fixture.detectChanges()
        const listContainer = fixture.debugElement.query( By.css(`[aria-label="${ARIA_LABELS.AVAILABILITY_IN_OTHER_REF_SPACE}"]`) )

        // trim white spaces before and after, and middle white spaces into a single white space
        const texts = Array.from(listContainer.nativeElement.children).map((c: HTMLElement) => c.textContent.replace(/^\s+/, '').replace(/\s+$/, '').replace(/\s+/g, ' '))
        expect(texts).toContain(`${mt0.name} (left hemisphere)`)
        expect(texts).toContain(`${mt1.name} (left hemisphere)`)
      })
    })
  })
})