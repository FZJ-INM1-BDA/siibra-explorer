import { NgModule } from "@angular/core";
import { NehubaViewerContainerDirective } from './nehubaViewerInterface/nehubaViewerInterface.directive'
import { NehubaViewerUnit } from "./nehubaViewer/nehubaViewer.component";
import { CommonModule } from "@angular/common";
@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [
    NehubaViewerContainerDirective,
    NehubaViewerUnit
  ],
  exports: [
    NehubaViewerContainerDirective,
    NehubaViewerUnit
  ],
  entryComponents: [
    NehubaViewerUnit
  ]
})

export class NehubaModule{}
