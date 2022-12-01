import { HttpClientModule } from "@angular/common/http"
import { Meta, moduleMetadata, Story } from "@storybook/angular"
import { action } from "@storybook/addon-actions"
import { SAPI } from "src/atlasComponents/sapi"
import { atlasId, provideDarkTheme, getParcRegions, parcId, spaceId } from "src/atlasComponents/sapi/stories.base"
import { SapiViewsCoreRichModule } from "../module"
import { SapiViewsCoreRichRegionListSearch } from "./regionListSearch.component"
import { Pipe, PipeTransform } from "@angular/core"
import { SapiRegionModel } from "src/atlasComponents/sapi/type"
import { DomSanitizer } from "@angular/platform-browser"
import { SapiViewsCoreRegionModule } from "../../region"

@Pipe({
  name: 'regionTmplPipe',
  pure: true
})

class RegionTmplPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer){

  }
  public transform(region: SapiRegionModel) {
    console.log(
      region,
      (region?.name || '').indexOf("left") >= 0
    )
    return this.sanitizer.bypassSecurityTrustHtml(
      (region?.name || '').includes("left")
        ? `<i class="fas fa-square"></i>`
        : `<i class="fas fa-check-square"></i>`
    )
  }
}

export default {
  component: SapiViewsCoreRichRegionListSearch,
  decorators: [
    moduleMetadata({
      imports: [
        HttpClientModule,
        SapiViewsCoreRichModule,
        SapiViewsCoreRegionModule,
      ],
      providers: [
        SAPI,
        ...provideDarkTheme,
      ],
      declarations: [
        RegionTmplPipe,
      ]
    })
  ],
} as Meta

const actionData = {
  onOptionSelected: { emit: action('onOptionSelected')}
}

const Template: Story<SapiViewsCoreRichRegionListSearch> = (args: SapiViewsCoreRichRegionListSearch, { loaded, parameters }) => {
  const { 
    regions
  } = loaded
  const {
    contentProjection,
    tmplRef
  } = parameters
  const template = `
  <sxplr-sapiviews-core-rich-regionlistsearch>
    ${tmplRef ? ('<ng-template regionTemplate let-region>' + tmplRef + '</ng-template>') : ''}
    ${contentProjection || ''}
  </sxplr-sapiviews-core-rich-regionlistsearch>
  `
  
  return ({
    props: {
      regions,
      onOptionSelected: actionData.onOptionSelected
    },
    template
  })
}
Template.loaders = []
Template.parameters = {
  tmplRef: `<span>{{ region.name }}</span>`
}

const asyncLoader = async (atlasId: string, parcId: string, spaceId: string) => {
  const regions = await getParcRegions(atlasId, parcId, spaceId)
  return {
    regions
  }
}

const getContentProjection = ({ searchInputSuffix }) => {
  let returnVal = ''
  if (searchInputSuffix) {
    returnVal += `<span search-input-suffix>${searchInputSuffix}</span>`
  }
  return returnVal
}

export const Default = Template.bind({})
Default.parameters = {
  ...Template.parameters,
  tmplRef: `
<sxplr-sapiviews-core-region-region-list-item
  [sxplr-sapiviews-core-region-region]="region">
</sxplr-sapiviews-core-region-region-list-item>
`
}
Default.loaders = [
  async () => {
    const { regions } = await asyncLoader(atlasId.human, parcId.human.jba29, spaceId.human.mni152)
    return { regions }
  }
]

export const InputSuffix = Template.bind({})
InputSuffix.loaders = [
  async () => {
    const { regions } = await asyncLoader(atlasId.human, parcId.human.jba29, spaceId.human.mni152)
    return { regions }
  }
]
InputSuffix.parameters = {
  ...Template.parameters,
  contentProjection: getContentProjection({
    searchInputSuffix: `SUFFIX`
  })
}

export const TemplatedRegionSuffix = Template.bind({})
TemplatedRegionSuffix.loaders = [
  async () => {
    const { regions } = await asyncLoader(atlasId.human, parcId.human.jba29, spaceId.human.mni152)
    return { regions }
  }
]
TemplatedRegionSuffix.parameters = {
  ...Template.parameters,
  tmplRef: `<span [innerHTML]="region | regionTmplPipe"></span><span>{{ region.name }}</span>`
}


export const Waxholm = Template.bind({})
Waxholm.loaders = [
  async () => {
    const { regions } = await asyncLoader(atlasId.rat, parcId.rat.v4, spaceId.rat.waxholm)
    return { regions }
  }
]

