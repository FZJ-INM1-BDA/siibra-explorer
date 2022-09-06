import { idMat4, NgLayerCtrlCmp } from "./ngLayerCtrl.component"
import { Meta, moduleMetadata, Story } from "@storybook/angular"
import { CommonModule } from "@angular/common"
import { MatButtonModule } from "@angular/material/button"
import { NEHUBA_INSTANCE_INJTKN } from "../util"
import { NEVER } from "rxjs"
import { action } from "@storybook/addon-actions"
import { MatTooltipModule } from "@angular/material/tooltip"
import { Store } from "@ngrx/store"

export default {
  component: NgLayerCtrlCmp,
  decorators: [
    moduleMetadata({
      imports: [
        CommonModule,
        MatButtonModule,
        MatTooltipModule,
      ],
      providers: [
        {
          provide: NEHUBA_INSTANCE_INJTKN,
          useValue: NEVER,
        },
        {
          provide: Store,
          useValue: {
            dispatch: action('dispatch')
          }
        }
      ]
    }),
  ]
} as Meta


const Template: Story<NgLayerCtrlCmp> = (args: any, { parameters }) => {

  const {
    'ng-layer-ctl-name': name,
    'ng-layer-ctl-transform': transform
  } = args

  const {
    pName,
    pXform
  } = parameters
  
  return {
    props: {
      name: name || pName || 'default name',
      transform: transform || pXform || idMat4,
    }
  }
}

export const NgLayerTune = Template.bind({})
NgLayerTune.parameters = {
  pXform: [[-0.74000001,0,0,38134608],[0,-0.26530117,-0.6908077,13562314],[0,-0.6908077,0.26530117,-3964904],[0,0,0,1]]
}
