import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FileInputDirective } from "./getFileInput.directive";
import { FileInputModal } from "./fileInputModal/fileInputModal.component";
import { FormsModule } from "@angular/forms";
import { AngularMaterialModule } from "src/sharedModules";
import { DragDropFileDirective } from "src/dragDropFile";

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    DragDropFileDirective,
    AngularMaterialModule,
  ],
  declarations: [
    FileInputDirective,
    FileInputModal,
  ],
  exports: [
    FileInputDirective,
    FileInputModal,
  ],
})

export class FileInputModule{}