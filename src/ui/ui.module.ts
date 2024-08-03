import { NgModule } from "@angular/core";
import { ComponentsModule } from "src/components/components.module";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { LayoutModule } from "src/layouts/layout.module";
import { ScrollingModule } from "@angular/cdk/scrolling"
import { HttpClientModule } from "@angular/common/http";
import { AngularMaterialModule } from 'src/sharedModules'
import { UtilModule } from "src/util";
import { ShareModule } from "src/share";
import { AuthModule } from "src/auth";
import { ActionDialog } from "./actionDialog/actionDialog.component";
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
    ActionDialog,
  ],
  providers: [
    {
      provide: HANDLE_SCREENSHOT_PROMISE,
      useValue: ((param) => {
        const ngCanvas: HTMLCanvasElement = document.querySelector('#neuroglancer-container canvas')
        const threeSurferCanvas: HTMLCanvasElement = document.querySelector('three-surfer-glue-cmp canvas')
        
        if (threeSurferCanvas) {
          const tsViewer = window['tsViewer']
          tsViewer.renderer.render(tsViewer.scene, tsViewer.camera)
        }
        if (ngCanvas) {
          window['viewer'].display.draw()
        }
        const canvas = ngCanvas || threeSurferCanvas
        if (!canvas) {
          return Promise.reject(`element '#neuroglancer-container canvas' or 'three-surfer-glue-cmp canvas' not found`)
        }
        
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
  ]
})

export class UIModule {
}
