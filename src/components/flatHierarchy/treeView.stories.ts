import { CommonModule } from "@angular/common"
import { HttpClientModule } from "@angular/common/http"
import { Component, EventEmitter } from "@angular/core"
import { action } from "@storybook/addon-actions"
import { Meta, moduleMetadata, Story } from "@storybook/angular"
import { SapiRegionModel } from "src/atlasComponents/sapi"
import { atlasId, provideDarkTheme, getParcRegions, parcId, spaceId } from "src/atlasComponents/sapi/stories.base"
import { AngularMaterialModule } from "src/sharedModules"
import { SxplrFlatHierarchyModule } from "./module"


@Component({
  selector: `hierarchy-flatview-wrapper`,
  template: `
  <ng-template #tmplRef let-region>
    <div class="mat-body sxplr-d-flex sxplr-align-items-center sxplr-h-100 region-tmpl">
      {{ region.name }}
    </div>
  </ng-template>
  <sxplr-flat-hierarchy-tree-view
    [sxplr-flat-hierarchy-tree-view-show-control]="showControl"
    [sxplr-flat-hierarchy-nodes]="regions"
    [sxplr-flat-hierarchy-is-parent]="isParent"
    [sxplr-flat-hierarchy-tree-view-node-label-toggles]="nodeLabelToggles"
    [sxplr-flat-hierarchy-tree-view-lineheight]="lineHeight"
    [sxplr-flat-hierarchy-render-node-tmpl]="tmplRef"
    (sxplr-flat-hierarchy-tree-view-node-clicked)="nodeClicked.emit($event)">
  </sxplr-flat-hierarchy-tree-view>
  
  `,
  styles: [
    `
    .region-tmpl
    {
      text-overflow: clip;
      white-space: nowrap;
    }
    `
  ]
})

class HierarchyFlatViewWrapper{
  regions: SapiRegionModel[] = []
  showControl = false
  nodeLabelToggles = true
  lineHeight: number = 35
  nodeClicked = new EventEmitter<SapiRegionModel>()
  isParent(region: SapiRegionModel, parentRegion: SapiRegionModel) {
    return region.hasParent?.some(parent => parent['@id'] === parentRegion["@id"])
  }
}

export default {
  component: HierarchyFlatViewWrapper,
  decorators: [
    moduleMetadata({
      imports: [
        CommonModule,
        HttpClientModule,
        SxplrFlatHierarchyModule,
        AngularMaterialModule,
      ],
      providers: [
        ...provideDarkTheme,
      ],
      declarations: []
    })
  ],
} as Meta

const Template: Story<HierarchyFlatViewWrapper> = (args: HierarchyFlatViewWrapper, { loaded, parameters }) => {
  const { 
    regions
  } = loaded
  
  const {
    
  } = parameters

  const {
    showControl,
    nodeLabelToggles,
    lineHeight,
  } = args
  return ({
    props: {
      regions,
      showControl: !!showControl,
      nodeLabelToggles: !!nodeLabelToggles,
      lineHeight: lineHeight || 35,
      nodeClicked: {
        emit: action("nodeClicked")
      }
    },
  })
}
Template.loaders = []

const asyncLoader = async (atlasId: string, parcId: string, spaceId: string) => {
  const regions = await getParcRegions(atlasId, parcId, spaceId)
  return {
    regions
  }
}

export const Default = Template.bind({})
Default.loaders = [
  async () => {
    const {
      regions
    } = await asyncLoader(atlasId.human, parcId.human.jba29, spaceId.human.mni152)
    return {
      regions
    }
  }
]
