import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { ViewerCtrlModule } from "../viewerCtrl";
import { NehubaLayoutOverlay } from "./nehuba.layoutOverlay/nehuba.layoutOverlay.component";
import { QuickTourModule } from "src/ui/quickTour";
import { SpinnerModule } from "src/components/spinner";
import { UtilModule } from "src/util";
import { WindowResizeModule } from "src/util/windowResize";
import { LayoutModule } from "src/layouts/layout.module";
import { AngularMaterialModule } from 'src/sharedModules/angularMaterial.module'

@NgModule({
  imports: [
    CommonModule,
    LayoutModule,
    ViewerCtrlModule,
    QuickTourModule,
    SpinnerModule,
    UtilModule,
    WindowResizeModule,
    AngularMaterialModule,
  ],
  declarations: [
    NehubaLayoutOverlay,
  ],
  exports: [
    NehubaLayoutOverlay
  ]
})

export class NehubaLayoutOverlayModule{}