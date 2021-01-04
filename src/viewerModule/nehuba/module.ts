import { NgModule } from "@angular/core";
import { NehubaViewerContainerDirective } from './nehubaViewerInterface/nehubaViewerInterface.directive'
import { IMPORT_NEHUBA_INJECT_TOKEN, NehubaViewerUnit } from "./nehubaViewer/nehubaViewer.component";
import { CommonModule } from "@angular/common";
import { APPEND_SCRIPT_TOKEN } from "src/util/constants";
import { importNehubaFactory } from "./util";
import { NehubaViewerTouchDirective } from "./nehubaViewerInterface/nehubaViewerTouch.directive";
import { StoreModule } from "@ngrx/store";
import { NEHUBA_VIEWER_FEATURE_KEY } from "./constants";
import { reducer } from "./store";

@NgModule({
  imports: [
    CommonModule,
    StoreModule.forFeature(
      NEHUBA_VIEWER_FEATURE_KEY,
      reducer
    )
  ],
  declarations: [
    NehubaViewerContainerDirective,
    NehubaViewerUnit,
    NehubaViewerTouchDirective,
  ],
  exports: [
    NehubaViewerContainerDirective,
    NehubaViewerUnit,
    NehubaViewerTouchDirective,
  ],
  providers: [
    {
      provide: IMPORT_NEHUBA_INJECT_TOKEN,
      useFactory: importNehubaFactory,
      deps: [ APPEND_SCRIPT_TOKEN ]
    }
  ]
})

export class NehubaModule{}
