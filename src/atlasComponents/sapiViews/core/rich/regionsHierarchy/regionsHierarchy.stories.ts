import { CommonModule } from "@angular/common"
import { HttpClientModule } from "@angular/common/http"
import { Component, EventEmitter, TemplateRef, ViewChild } from "@angular/core"
import { MatDialog } from "@angular/material/dialog"
import { action } from "@storybook/addon-actions"
import { Meta, moduleMetadata, Story } from "@storybook/angular"
import { atlasId, provideDarkTheme, getParcRegions, getAtlas, getParc } from "src/atlasComponents/sapi/stories.base"
import { SapiRegionModel } from "src/atlasComponents/sapi/type"
import { AngularMaterialModule } from "src/sharedModules"
import { SapiViewsCoreRichModule } from "../module"

@Component({
  selector: `region-tree-hierarchy-wrapper`,
  template: `
  <ng-template #matDialog let-data>
    <div class="sxplr-w-100 sxplr-h-100">
      <sxplr-sapiviews-core-rich-regionshierarchy
        class="sxplr-w-100 sxplr-h-100"
        [sxplr-sapiviews-core-rich-regionshierarchy-placeholder]="data.placeholder"
        [sxplr-sapiviews-core-rich-regionshierarchy-regions]="data.regions"
        (sxplr-sapiviews-core-rich-regionshierarchy-region-select)="nodeClicked.emit($event)"
        >
      </sxplr-sapiviews-core-rich-regionshierarchy>
    </div>
  </ng-template>
  <mat-accordion>
    <mat-expansion-panel *ngFor="let item of regionsDict | keyvalue">

      <mat-expansion-panel-header>
        {{ item.key }}
      </mat-expansion-panel-header>

      <ng-template matExpansionPanelContent>
      <button mat-button
        (click)="openDialog(moreItem.key, moreItem.value)"
        *ngFor="let moreItem of item.value | keyvalue">
        {{ moreItem.key }}
      </button>
      </ng-template>

    </mat-expansion-panel>
  </mat-accordion>
  `,
  styles: [
    ``
  ]
})

class RegionTreeHierarchyWrapper {
  regionsDict: Record<string, Record<string, SapiRegionModel[]>> = {}
  nodeClicked = new EventEmitter()

  @ViewChild('matDialog', { read: TemplateRef })
  dialogTmpl: TemplateRef<any>

  openDialog(parcellationName: string, regions: SapiRegionModel[]){
    this.dialog.open(this.dialogTmpl, {
      height: '90vh',
      width: '90vw',
      data: {
        placeholder: `Search regions in ${parcellationName} ...`,
        regions
      }
    })
  }

  constructor(private dialog: MatDialog){

  }
}

export default {
  component: RegionTreeHierarchyWrapper,
  decorators: [
    moduleMetadata({
      imports: [
        CommonModule,
        HttpClientModule,
        SapiViewsCoreRichModule,
        AngularMaterialModule,
      ],
      providers: [
        ...provideDarkTheme,
      ],
      declarations: []
    })
  ],
} as Meta

const Template: Story<RegionTreeHierarchyWrapper> = (args: RegionTreeHierarchyWrapper, { loaded, parameters }) => {
  const { 
    regionsDict
  } = loaded
  
  const {
    
  } = parameters

  const {
    
  } = args

  return ({
    props: {
      regionsDict,
      nodeClicked: {
        emit: action("nodeClicked")
      }
    },
  })
}
Template.loaders = []

const asyncLoader = async () => {
  const regionsDict: Record<string, Record<string, SapiRegionModel[]>> = {}
  for (const species in atlasId) {
    const atlasDetail = await getAtlas(atlasId[species])
    regionsDict[species] = {}
    
    await Promise.all(
      atlasDetail.parcellations.map(async parc => {
        try {
          const parcDetail = await getParc(atlasDetail['@id'], parc['@id'])
          regionsDict[species][parcDetail.name] = await getParcRegions(atlasDetail['@id'], parc['@id'], atlasDetail.spaces[0]["@id"] )
        } catch (e) {
          console.warn(`fetching region detail for ${parc["@id"]} failed... Skipping...`)
        }
      })
    )
  }

  return {
    regionsDict
  }
}

export const Default = Template.bind({})
Default.loaders = [
  async () => {
    const {
      regionsDict
    } = await asyncLoader()
    return {
      regionsDict
    }
  }
]
