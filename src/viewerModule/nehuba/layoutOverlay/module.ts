import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { MatMenuModule } from "@angular/material/menu";
import { ViewerCtrlModule } from "../viewerCtrl";
import { NehubaLayoutOverlay } from "./nehuba.layoutOverlay/nehuba.layoutOverlay.component";
import { QuickTourModule } from "src/ui/quickTour";
import { SpinnerModule } from "src/components/spinner";
import { UtilModule } from "src/util";
import { WindowResizeModule } from "src/util/windowResize";
import { LayoutModule } from "src/layouts/layout.module";
import { MatButtonModule } from "@angular/material/button";
import { MatTooltipModule } from "@angular/material/tooltip";

@NgModule({
  imports: [
    MatMenuModule,
    CommonModule,
    LayoutModule,
    ViewerCtrlModule,
    QuickTourModule,
    SpinnerModule,
    UtilModule,
    WindowResizeModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  declarations: [
    NehubaLayoutOverlay,
  ],
  exports: [
    NehubaLayoutOverlay
  ]
})

export class NehubaLayoutOverlayModule{}