import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FileInputDirective } from "./getFileInput.directive";
import { FileInputModal } from "./fileInputModal/fileInputModal.component";
import { FormsModule } from "@angular/forms";
import { DragDropFileModule } from "src/dragDropFile/module";
import { AngularMaterialModule } from "src/sharedModules";

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    DragDropFileModule,
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