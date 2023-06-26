import { CommonModule } from "@angular/common"
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core"
import { MatDialogModule } from "@angular/material/dialog"
import { MatSnackBarModule } from "@angular/material/snack-bar"
import { DragDropFileModule } from "src/dragDropFile"
import { UserLayerDragDropDirective } from "./userlayerDragdrop.directive"
import { UserLayerService } from "./service"
import { MatButtonModule } from "@angular/material/button"
import { MatTooltipModule } from "@angular/material/tooltip"
import { UserLayerInfoCmp } from "./userlayerInfo/userlayerInfo.component"
import { UtilModule } from "src/util"
import { SpinnerModule } from "src/components/spinner"

@NgModule({
  imports: [
    CommonModule,
    DragDropFileModule,
    MatSnackBarModule,
    MatDialogModule,
    MatButtonModule,
    MatTooltipModule,
    UtilModule,
    SpinnerModule,
  ],
  declarations: [UserLayerDragDropDirective, UserLayerInfoCmp],
  exports: [UserLayerDragDropDirective],
  providers: [UserLayerService],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NehubaUserLayerModule {}
