import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { DragDropFileDirective } from "./dragDrop.directive";

@NgModule({
  imports: [CommonModule],
  declarations: [DragDropFileDirective],
  exports: [DragDropFileDirective],
})
export class DragDropFileModule {}
