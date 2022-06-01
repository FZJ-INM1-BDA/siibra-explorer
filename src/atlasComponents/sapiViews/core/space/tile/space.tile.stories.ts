import { CommonModule } from "@angular/common"
import { HttpClientModule } from "@angular/common/http"
import { Component, Input } from "@angular/core"
import { Meta, moduleMetadata, Story } from "@storybook/angular"
import { SAPI, SapiSpaceModel } from "src/atlasComponents/sapi"
import { atlasId, spaceId, getAtlas, getSpace, provideDarkTheme } from "src/atlasComponents/sapi/stories.base"
import { AngularMaterialModule } from "src/sharedModules"
import { SapiViewsCoreSpaceModule } from "../module"
import { SapiViewsCoreSpaceSpaceTile } from "./space.tile.component"

@Component({
  selector: `space-tile-wrapper`,
  template: `
  <mat-accordion>
    <mat-expansion-panel *ngFor="let item of spaces | keyvalue">

      <mat-expansion-panel-header>
        {{ item.key }}
      </mat-expansion-panel-header>

      <ng-template matExpansionPanelContent>
        <div class="sxplr-d-inline-flex align-items-start">
          <sxplr-sapiviews-core-space-tile
            *ngFor="let spc of item.value"
            [sxplr-sapiviews-core-space-tile-space]="spc"
            [sxplr-sapiviews-core-space-tile-selected]="spc['@id'] === selected"
            class="sxplr-m-2">
          </sxplr-sapiviews-core-space-tile>
        </div>
      </ng-template>

    </mat-expansion-panel>
  </mat-accordion>
  `,
  styles: [
    `sxplr-sapiviews-core-space-tile { display: inline-block; max-width: 8rem; }`
  ]
})

class SpaceTileWrapper{
  @Input()
  spaces: Record<string, SapiSpaceModel[]> = {}

  @Input()
  selected: string = spaceId.human.mni152
}

export default {
  component: SpaceTileWrapper,
  decorators: [
    moduleMetadata({
      imports: [
        CommonModule,
        HttpClientModule,
        SapiViewsCoreSpaceModule,
        AngularMaterialModule,
      ],
      providers: [
        SAPI,
        ...provideDarkTheme,
      ],
      declarations: [
        SpaceTileWrapper
      ]
    })
  ],
} as Meta

const Template: Story<SapiViewsCoreSpaceSpaceTile> = (args: SapiViewsCoreSpaceSpaceTile, { loaded }) => {
  const { 
    spaces
  } = loaded

  return ({
    props: {
      ...args,
      spaces
    }
  })
}
Template.loaders = [

]

const asyncLoader = async () => {
  const spaces: Record<string, SapiSpaceModel[]> = {}
  for (const species in atlasId) {
    const atlasDetail = await getAtlas(atlasId[species])
    spaces[species] = []
    
    for (const spc of atlasDetail.spaces) {
      const spcDetail = await getSpace(atlasDetail['@id'], spc['@id'])
      spaces[species].push(spcDetail)
    }
  }

  return {
    spaces
  }
}

export const Default = Template.bind({})
Default.args = {
  selected: spaceId.human.mni152
}
Default.loaders = [

  async () => {
    const {
      spaces
    } = await asyncLoader()
    return {
      spaces
    }
  }
]
