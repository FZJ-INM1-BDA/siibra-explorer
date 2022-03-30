import { CommonModule, DOCUMENT } from "@angular/common"
import { HttpClientModule } from "@angular/common/http"
import { Component, NgZone, ViewChild } from "@angular/core"
import { FormsModule } from "@angular/forms"
import { BrowserAnimationsModule } from "@angular/platform-browser/animations"
import { Meta, moduleMetadata, Story } from "@storybook/angular"
import { BehaviorSubject, Subject } from "rxjs"
import { SAPI, SapiAtlasModel, SapiParcellationModel, SapiRegionModel, SapiSpaceModel } from "src/atlasComponents/sapi"
import { addAddonEventListener, getHoc1RightFeatureDetail, getHoc1RightFeatures, getHoc1Right, getHumanAtlas, getJba29, getMni152, provideDarkTheme } from "src/atlasComponents/sapi/stories.base"
import { SapiRegionalFeatureReceptorModel } from "src/atlasComponents/sapi/type"
import { AngularMaterialModule } from "src/sharedModules"
import { appendScriptFactory, APPEND_SCRIPT_TOKEN } from "src/util/constants"
import { DARKTHEME } from "src/util/injectionTokens"
import { ReceptorViewModule } from ".."
import { Profile } from "./profile.component"

@Component({
  selector: 'autoradiograph-wrapper-cmp',
  template: `
  <mat-form-field appearance="fill">
    <mat-select [(ngModel)]="selectedSymbol">
      <mat-option value="" disabled>
        --select--
      </mat-option>

      <mat-option [value]="option"
        *ngFor="let option of options">
        {{ option }}
      </mat-option>
    </mat-select>
  </mat-form-field>
  <sxplr-sapiviews-features-receptor-profile
    class="d-inline-block w-100 h-100"
    [sxplr-sapiviews-features-receptor-atlas]="atlas"
    [sxplr-sapiviews-features-receptor-parcellation]="parcellation"
    [sxplr-sapiviews-features-receptor-template]="template"
    [sxplr-sapiviews-features-receptor-region]="region"
    [sxplr-sapiviews-features-receptor-featureid]="featureId"
    [sxplr-sapiviews-features-receptor-data]="feature"
    [sxplr-sapiviews-features-receptor-profile-selected-symbol]="selectedSymbol"
  >
  </sxplr-sapiviews-features-receptor-profile>
  `,
  styles: [
    `
    :host
    {
      display: block;
      max-width: 24rem;
      max-height: 24rem;
    }
    `
  ]
})
class ProfileWrapperCls {
  atlas: SapiAtlasModel
  parcellation: SapiParcellationModel
  template: SapiSpaceModel
  region: SapiRegionModel

  feature: SapiRegionalFeatureReceptorModel
  featureId: string

  @ViewChild(Profile)
  profile: Profile

  selectedSymbol: string

  get options(){
    return Object.keys(this.feature?.data?.profiles || this.profile?.receptorData?.data?.profiles || {})
  }
}

export default {
  component: ProfileWrapperCls,
  decorators: [
    moduleMetadata({
      imports: [
        CommonModule,
        AngularMaterialModule,
        HttpClientModule,
        BrowserAnimationsModule,
        FormsModule,
        ReceptorViewModule,
      ],
      providers: [
        SAPI,
        {
          provide: APPEND_SCRIPT_TOKEN,
          useFactory: appendScriptFactory,
          deps: [ DOCUMENT ]
        },
        ...provideDarkTheme,
      ],
      declarations: []
    })
  ],
} as Meta

const Template: Story<ProfileWrapperCls> = (args: ProfileWrapperCls, { loaded }) => {
  const { atlas, parc, space, region, featureId, feature } = loaded
  return ({
    props: {
      ...args,
      atlas: atlas,
      parcellation: parc,
      template: space,
      region: region,
      feature,
      featureId,
    },
  })
}

const loadFeat = async () => {
  const atlas = await getHumanAtlas()
  const parc = await getJba29()
  const region = await getHoc1Right()
  const space = await getMni152()
  const features = await getHoc1RightFeatures()
  const receptorfeat = features.find(f => f['@type'] === "siibra/features/receptor")
  const feature = await getHoc1RightFeatureDetail(receptorfeat["@id"])
  return {
    atlas,
    parc,
    space,
    region,
    featureId: receptorfeat["@id"],
    feature
  }
}

export const Default = Template.bind({})
Default.args = {

}
Default.loaders = [
  async () => {
    const { atlas, parc, space, region, featureId } = await loadFeat()
    return {
      atlas, parc, space, region, featureId
    }
  }
]

export const LoadViaDirectlyInjectData = Template.bind({})
LoadViaDirectlyInjectData.loaders = [
  async () => {

    const { feature } = await loadFeat()
    return {
      feature
    }
  }
]
