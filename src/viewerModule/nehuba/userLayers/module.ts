import { CommonModule } from "@angular/common"
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core"
import { DragDropFileModule } from "src/dragDropFile"
import { UserLayerDragDropDirective } from "./userlayerDragdrop.directive"
import { UserLayerInfoCmp } from "./userlayerInfo/userlayerInfo.component"
import { UtilModule } from "src/util"
import { SpinnerModule } from "src/components/spinner"
import { AngularMaterialModule } from "src/sharedModules"
import { IconComponent } from "src/sharedModules/icon"

@NgModule({
  imports: [
    CommonModule,
    DragDropFileModule,
    AngularMaterialModule,
    UtilModule,
    SpinnerModule,
    IconComponent,
  ],
  declarations: [UserLayerDragDropDirective, UserLayerInfoCmp],
  exports: [UserLayerDragDropDirective],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NehubaUserLayerModule {}
