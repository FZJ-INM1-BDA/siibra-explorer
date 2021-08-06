import { TestBed, async } from "@angular/core/testing"
import { RegionMenuComponent } from "./regionMenu.component"
import { AngularMaterialModule } from "src/sharedModules"
import { UtilModule } from "src/util/util.module"
import { CommonModule } from "@angular/common"
import { provideMockStore } from "@ngrx/store/testing"
import { Component, Directive, Input } from "@angular/core"
import { NoopAnimationsModule } from "@angular/platform-browser/animations"
import { ComponentsModule } from "src/components"
import { ParcellationRegionModule } from "../module"
import { BS_ENDPOINT } from "src/util/constants"

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

@Component({
  selector: 'kg-regional-features-list',
  template: ''
})

class DummyKgRegionalFeatureList{}

@Directive({
  selector: '[kg-regional-features-list-directive]',
  exportAs: 'kgRegionalFeaturesListDirective'
})

class DummySingleDatasetDirective{
  @Input()
  region: string

}

describe('> regionMenu.component.ts', () => {
  describe('> RegionMenuComponent', () => {
    beforeEach(async(() => {

      TestBed.configureTestingModule({
        imports: [
          UtilModule,
          AngularMaterialModule,
          CommonModule,
          NoopAnimationsModule,
          ComponentsModule,
          ParcellationRegionModule,
        ],
        declarations: [
          /**
           * Used by regionMenu.template.html to show region preview
           */
          DummySingleDatasetDirective,
          DummyKgRegionalFeatureList,
        ],
        providers: [
          provideMockStore({ initialState: {} }),
          {
            provide: BS_ENDPOINT,
            useValue: 'http://example.dev/1_0'
          }
        ]
      }).compileComponents()
      
    }))

    it('> init just fine', () => {
      const fixture = TestBed.createComponent(RegionMenuComponent)
      expect(fixture).toBeTruthy()
    })
  })
})