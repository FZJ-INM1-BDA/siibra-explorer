import { NgModule } from "@angular/core";
import { ComponentsModule } from "src/components/components.module";

import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { LayoutModule } from "src/layouts/layout.module";

import { ScrollingModule } from "@angular/cdk/scrolling"
import { HttpClientModule } from "@angular/common/http";
import { AngularMaterialModule } from 'src/sharedModules'
import { UtilModule } from "src/util";
import { DownloadDirective } from "../util/directives/download.directive";

import { LogoContainer } from "./logoContainer/logoContainer.component";
import { MobileOverlay } from "./nehubaContainer/mobileOverlay/mobileOverlay.component";
import { MobileControlNubStylePipe } from "./nehubaContainer/pipes/mobileControlNubStyle.pipe";

import { HumanReadableFileSizePipe } from "src/util/pipes/humanReadableFileSize.pipe";

import { ReorderPanelIndexPipe } from "./nehubaContainer/reorderPanelIndex.pipe";

import { FixedMouseContextualContainerDirective } from "src/util/directives/FixedMouseContextualContainerDirective.directive";

import { ShareModule } from "src/share";
import { AuthModule } from "src/auth";
import { ActionDialog } from "./actionDialog/actionDialog.component";
import { APPEND_SCRIPT_TOKEN, appendScriptFactory } from "src/util/constants";
import { DOCUMENT } from "@angular/common";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { Landmark2DModule } from "./nehubaContainer/2dLandmarks/module";
import { HANDLE_SCREENSHOT_PROMISE, TypeHandleScrnShotPromise } from "../screenshot";
import { ParcellationRegionModule } from "src/atlasComponents/parcellationRegion";
import { AtlasCmpParcellationModule } from "src/atlasComponents/parcellation";
import { DialogInfoModule } from "./dialogInfo"

@NgModule({
  imports : [
    BrowserAnimationsModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    LayoutModule,
    ComponentsModule,
    UtilModule,
    ScrollingModule,
    AngularMaterialModule,
    ShareModule,
    AuthModule,
    Landmark2DModule,
    ParcellationRegionModule,
    AtlasCmpParcellationModule,
    DialogInfoModule,
  ],
  declarations : [
    
    LogoContainer,
    MobileOverlay,

    ActionDialog,

    /* pipes */
    MobileControlNubStylePipe,

    HumanReadableFileSizePipe,
    ReorderPanelIndexPipe,

    /* directive */
    DownloadDirective,
    FixedMouseContextualContainerDirective,
  ],
  providers: [
    {
      provide: APPEND_SCRIPT_TOKEN,
      useFactory: appendScriptFactory,
      deps: [ DOCUMENT ]
    },
    {
      provide: HANDLE_SCREENSHOT_PROMISE,
      useValue: ((param) => {
        const canvas: HTMLCanvasElement = document.querySelector('#neuroglancer-container canvas')
        if (!canvas) return Promise.reject(`element '#neuroglancer-container canvas' not found`)
        const _ = (window as any).viewer.display.draw()
        if (!param) {
          return new Promise(rs => {
            canvas.toBlob(blob => {
              const url = URL.createObjectURL(blob)
              rs({
                url,
                revoke: () => URL.revokeObjectURL(url)
              })
            }, 'image/png')
          })
        }
        const { x, y, width, height } = param
        return new Promise(rs => {
          const subCanvas = document.createElement('canvas')
          subCanvas.width = width
          subCanvas.height = height
          const context = subCanvas.getContext('2d')
          context.drawImage(
            canvas,

            /**
             * from
             */
            x,
            y,
            width,
            height,

            /**
             * to
             */
            0,
            0,
            width,
            height
          )

          subCanvas.toBlob(blob => {
            const url = URL.createObjectURL(blob)
            rs({
              url,
              revoke: () => URL.revokeObjectURL(url)
            })
          }, 'image/png')
        })
      }) as TypeHandleScrnShotPromise
    }
  ],
  entryComponents : [

    /* dynamically created components needs to be declared here */
    
    ActionDialog,
  ],
  exports : [
    // NehubaContainer,
    
    LogoContainer,
    MobileOverlay,
    
    // StatusCardComponent,
    FixedMouseContextualContainerDirective,
  ]
})

export class UIModule {
}
