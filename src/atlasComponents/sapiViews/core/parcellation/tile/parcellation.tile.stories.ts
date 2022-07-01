import { CommonModule } from "@angular/common"
import { HttpClientModule } from "@angular/common/http"
import { Component, Input, Output, EventEmitter } from "@angular/core"
import { provideMockStore } from "@ngrx/store/testing"
import { Meta, moduleMetadata, Story } from "@storybook/angular"
import { SAPI, SapiParcellationModel } from "src/atlasComponents/sapi"
import { atlasId, parcId, getAtlas, provideDarkTheme, getParc } from "src/atlasComponents/sapi/stories.base"
import { AngularMaterialModule } from "src/sharedModules"
import { SapiViewsCoreParcellationModule } from "../module"

@Component({
  selector: `parc-tile-wrapper`,
  template: `
  <ng-template #grpParcTmpl let-parc>
    {{ parc.name }}
  </ng-template>

  <mat-accordion>
    <mat-expansion-panel *ngFor="let item of parcs | keyvalue">

      <mat-expansion-panel-header>
        {{ item.key }}
      </mat-expansion-panel-header>

      <ng-template matExpansionPanelContent>
        <div class="sxplr-d-inline-flex align-items-start">
          <sxplr-sapiviews-core-parcellation-tile
            *ngFor="let parc of item.value"
            [sxplr-sapiviews-core-parcellation-tile-parcellation]="parc"
            [sxplr-sapiviews-core-parcellation-tile-selected]="parc['@id'] === selected"
            class="sxplr-m-2"
            (sxplr-sapiviews-core-parcellation-tile-onclick-parc)="parcClicked.emit($event)">
          </sxplr-sapiviews-core-parcellation-tile>
        </div>
      </ng-template>

    </mat-expansion-panel>

    <mat-expansion-panel>
      <mat-expansion-panel-header>
        > grouped
      </mat-expansion-panel-header>

      <ng-template matExpansionPanelContent>
        <ng-container *ngFor="let item of parcs | keyvalue">
          <sxplr-sapiviews-core-parcellation-tile
            *ngFor="let parc of (item.value | filterGroupedParcs : true)"
            [sxplr-sapiviews-core-parcellation-tile-parcellation]="parc"
            class="sxplr-m-2"
            (sxplr-sapiviews-core-parcellation-tile-onclick-parc)="parcClicked.emit($event)">
          </sxplr-sapiviews-core-parcellation-tile>
        </ng-container>
      </ng-template>
    </mat-expansion-panel>

    <mat-expansion-panel>
      <mat-expansion-panel-header>
        > grouped tmpl
      </mat-expansion-panel-header>

      <ng-template matExpansionPanelContent>
        <ng-container *ngFor="let item of parcs | keyvalue">
          <sxplr-sapiviews-core-parcellation-tile
            *ngFor="let parc of (item.value | filterGroupedParcs : true)"
            [sxplr-sapiviews-core-parcellation-tile-groupmenu-parc-tmpl]="grpParcTmpl"
            [sxplr-sapiviews-core-parcellation-tile-parcellation]="parc"
            class="sxplr-m-2"
            (sxplr-sapiviews-core-parcellation-tile-onclick-parc)="parcClicked.emit($event)">
          </sxplr-sapiviews-core-parcellation-tile>
        </ng-container>
      </ng-template>
    </mat-expansion-panel>
  </mat-accordion>
  `,
  styles: [
    `sxplr-sapiviews-core-parcellation-tile { display: inline-block; max-width: 8rem; }`
  ]
})

class ParcTileWrapper{
  @Input()
  parcs: Record<string, SapiParcellationModel[]> = {}

  @Input()
  selected: string = parcId.human.longBundle

  @Output()
  parcClicked = new EventEmitter()
}

export default {
  component: ParcTileWrapper,
  decorators: [
    moduleMetadata({
      imports: [
        CommonModule,
        HttpClientModule,
        SapiViewsCoreParcellationModule,
        AngularMaterialModule,
      ],
      providers: [
        provideMockStore(),
        SAPI,
        ...provideDarkTheme,
      ],
      declarations: [
        ParcTileWrapper
      ]
    })
  ],
} as Meta

const Template: Story<ParcTileWrapper> = (args: ParcTileWrapper, { loaded }) => {
  const { 
    parcs
  } = loaded

  return ({
    props: {
      ...args,
      parcs
    }
  })
}
Template.loaders = [

]

const asyncLoader = async () => {
  const parcs: Record<string, SapiParcellationModel[]> = {}
  for (const species in atlasId) {
    const atlasDetail = await getAtlas(atlasId[species])
    parcs[species] = []
    
    for (const parc of atlasDetail.parcellations) {
      const parcDetail = await getParc(atlasDetail['@id'], parc['@id'])
      parcs[species].push(parcDetail)
    }
  }

  return {
    parcs
  }
}

export const Default = Template.bind({})
Default.args = {
  selected: parcId.human.longBundle
}
Default.loaders = [

  async () => {
    const {
      parcs
    } = await asyncLoader()
    return {
      parcs
    }
  }
]
