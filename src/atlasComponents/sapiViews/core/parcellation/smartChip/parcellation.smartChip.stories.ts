import { CommonModule } from "@angular/common"
import { HttpClientModule } from "@angular/common/http"
import { Component, Input } from "@angular/core"
import { Meta, moduleMetadata, Story } from "@storybook/angular"
import { action } from "@storybook/addon-actions"
import { SAPI, SapiParcellationModel } from "src/atlasComponents/sapi"
import { atlasId, getAtlas, provideDarkTheme, getParc, getAtlases } from "src/atlasComponents/sapi/stories.base"
import { AngularMaterialModule } from "src/sharedModules"
import { SapiViewsCoreParcellationModule } from "../module"
import { provideMockStore } from "@ngrx/store/testing"
import { within, userEvent } from '@storybook/testing-library';
import { ARIA_LABELS } from "common/constants"
import { ParcellationVisibilityService } from "../parcellationVis.service"
import { of } from "rxjs"

@Component({
  selector: `parc-smart-chip-wrapper`,
  template: `
  <mat-accordion>
    <mat-expansion-panel *ngFor="let item of parcRecords | keyvalue">
      <mat-expansion-panel-header>
        {{ item.key }}
      </mat-expansion-panel-header>

      <div class="sxplr-of-x-scroll sxplr-white-space-nowrap">
        <sxplr-sapiviews-core-parcellation-smartchip *ngFor="let parc of item.value | filterUnsupportedParc"
          [sxplr-sapiviews-core-parcellation-smartchip-parcellation]="parc"
          [sxplr-sapiviews-core-parcellation-smartchip-all-parcellations]="item.value"
          (sxplr-sapiviews-core-parcellation-smartchip-select-parcellation)="selectParcellation($event)">
        </sxplr-sapiviews-core-parcellation-smartchip>
      </div>

    </mat-expansion-panel>
  </mat-accordion>
  `,
  styles: [
    `sxplr-sapiviews-core-parcellation-chip { display: block;  }`
  ]
})

class ParcSmartChipWrapper{
  @Input()
  parcRecords: Record<string, SapiParcellationModel[]> = {}

  selectParcellation(parc: SapiParcellationModel){

  }
}


export default {
  component: ParcSmartChipWrapper,
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
      declarations: []
    })
  ],
} as Meta

const Template: Story<ParcSmartChipWrapper> = (args: ParcSmartChipWrapper, { loaded, parameters }) => {
  const { 
    parcRecords
  } = loaded
  const { providers = [] } = parameters

  return ({
    props: {
      ...args,
      selectParcellation: action("selectParcellation"),
      parcRecords
    },
    moduleMetadata: {
      providers
    }
  })
}
Template.loaders = []

const asyncLoader = async () => {
  const parcRecords: Record<string, SapiParcellationModel[]> = {}

  for (const species in atlasId) {

    const atlasDetail = await getAtlas(atlasId[species])
    parcRecords[species] = []
    for (const parc of atlasDetail.parcellations) {
      const parcDetail = await getParc(atlasDetail['@id'], parc['@id'])
      parcRecords[species].push(parcDetail)
    }
  }
  
  return {
    parcRecords
  }
}

export const Default = Template.bind({})
Default.loaders = [
  async () => {
    const {
      parcRecords
    } = await asyncLoader()
    return {
      parcRecords
    }
  }
]

export const TestInteraction = Template.bind({})
TestInteraction.loaders = [
  ...Default.loaders
]
TestInteraction.parameters = {
  providers: [
    {
      provide: ParcellationVisibilityService,
      useValue: {
        setVisibility: action('setVisibility'),
        toggleVisibility: action('toggleVisibility'),
        visibility$: of(true)
      }
    }
  ]
}
TestInteraction.play = async ({ args, canvasElement }) => {
  const canvas = within(canvasElement)

  await userEvent.click(canvas.getByText("human"))
  const allEye = canvas.getAllByText(ARIA_LABELS.TOGGLE_DELINEATION)
  await userEvent.hover(allEye[0])
  await userEvent.click(allEye[0])
}
