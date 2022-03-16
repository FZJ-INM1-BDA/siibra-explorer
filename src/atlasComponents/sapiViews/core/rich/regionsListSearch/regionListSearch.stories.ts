import { HttpClientModule } from "@angular/common/http"
import { Meta, moduleMetadata, Story } from "@storybook/angular"
import { action } from "@storybook/addon-actions"
import { SAPI } from "src/atlasComponents/sapi"
import { atlasId, provideDarkTheme, getParcRegions, parcId, spaceId } from "src/atlasComponents/sapi/stories.base"
import { SapiViewsCoreRichModule } from "../module"
import { SapiViewsCoreRichRegionListSearch } from "./regionListSearch.component"
import { Pipe, PipeTransform, SecurityContext } from "@angular/core"
import { SapiRegionModel } from "src/atlasComponents/sapi/type"
import { DomSanitizer, SafeHtml } from "@angular/platform-browser"

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
  ${tmplRef ? ('<ng-template #tmplref let-region>' + tmplRef + '</ng-template>') : ''}
  <sxplr-sapiviews-core-rich-regionlistsearch
    ${tmplRef ? '[sxplr-sapiviews-core-rich-regionlistsearch-region-template-ref]="tmplref"' : ''}
    >
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
  tmplRef: `<span [innerHTML]="region | regionTmplPipe"></span>`
}


export const Waxholm = Template.bind({})
Waxholm.loaders = [
  async () => {
    const { regions } = await asyncLoader(atlasId.rat, parcId.rat.v4, spaceId.rat.waxholm)
    return { regions }
  }
]

