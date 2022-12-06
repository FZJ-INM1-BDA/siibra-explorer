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

@NgModule({
  imports: [
    CommonModule,
    DragDropFileModule,
    MatSnackBarModule,
    MatDialogModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  declarations: [UserLayerDragDropDirective, UserLayerInfoCmp],
  exports: [UserLayerDragDropDirective],
  providers: [UserLayerService],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NehubaUserLayerModule {}
