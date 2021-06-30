import { TestBed, async } from "@angular/core/testing"
import { RegionMenuComponent } from "./regionMenu.component"
import { AngularMaterialModule } from "src/ui/sharedModules/angularMaterial.module"
import { UtilModule } from "src/util/util.module"
import { CommonModule } from "@angular/common"
import { provideMockStore } from "@ngrx/store/testing"
import { RenderViewOriginDatasetLabelPipe } from '../region.base'
import { Directive, Input } from "@angular/core"
import { NoopAnimationsModule } from "@angular/platform-browser/animations"
import { ComponentsModule } from "src/components"
import { BSFeatureReceptorModule } from "src/atlasComponents/regionalFeatures/bsFeatures/receptor"

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

@Directive({
  selector: '[iav-dataset-preview-dataset-file]',
  exportAs: 'iavDatasetPreviewDatasetFile'
})
class MockPrvDsFileDirective {
  @Input('iav-dataset-preview-dataset-file') 
  file

  @Input('iav-dataset-preview-dataset-file-filename') 
  filefilename

  @Input('iav-dataset-preview-dataset-file-dataset') 
  filedataset

  @Input('iav-dataset-preview-dataset-file-kgid') 
  filekgid

  @Input('iav-dataset-preview-dataset-file-kgschema') 
  filekgschema

  @Input('iav-dataset-preview-dataset-file-fullid') 
  filefullid

}

@Directive({
  selector: '[single-dataset-directive]',
  exportAs: 'singleDatasetDirective'
})

class DummySingleDatasetDirective{
  @Input()
  kgId: string

  @Input()
  kgSchema: string
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
          BSFeatureReceptorModule,
        ],
        declarations: [
          RegionMenuComponent,
          RenderViewOriginDatasetLabelPipe,
          /**
           * Used by regionMenu.template.html to show region preview
           */
          MockPrvDsFileDirective,
          DummySingleDatasetDirective,
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
  })
})