import { NgModule } from "@angular/core";
import { ComponentsModule } from "src/components/components.module";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { LayoutModule } from "src/layouts/layout.module";
import { ScrollingModule } from "@angular/cdk/scrolling"
import { HttpClientModule } from "@angular/common/http";
import { AngularMaterialModule } from 'src/sharedModules'
import { UtilModule } from "src/util";
import { DownloadDirective } from "../util/directives/download.directive";
import { MobileOverlay } from "./nehubaContainer/mobileOverlay/mobileOverlay.component";
import { HumanReadableFileSizePipe } from "src/util/pipes/humanReadableFileSize.pipe";
import { ReorderPanelIndexPipe } from "./nehubaContainer/reorderPanelIndex.pipe";
import { ShareModule } from "src/share";
import { AuthModule } from "src/auth";
import { ActionDialog } from "./actionDialog/actionDialog.component";
import { APPEND_SCRIPT_TOKEN, appendScriptFactory } from "src/util/constants";
import { DOCUMENT } from "@angular/common";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { HANDLE_SCREENSHOT_PROMISE, TypeHandleScrnShotPromise } from "../screenshot";

@NgModule({
  imports: [
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
  ],
  declarations: [
    MobileOverlay,
    ActionDialog,
    /* pipes */
    HumanReadableFileSizePipe,
    ReorderPanelIndexPipe,
    /* directive */
    DownloadDirective,
  ],
  providers: [
    {
      provide: APPEND_SCRIPT_TOKEN,
      useFactory: appendScriptFactory,
      deps: [DOCUMENT]
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
  exports: [
    // NehubaContainer,
    MobileOverlay,
    // StatusCardComponent,
  ]
})

export class UIModule {
}
