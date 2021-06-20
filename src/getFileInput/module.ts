import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FileInputDirective } from "./getFileInput.directive";
import { MatDialogModule } from '@angular/material/dialog';
import { FileInputModal } from "./fileInputModal/fileInputModal.component";
import { FormsModule } from "@angular/forms";
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { DragDropFileModule } from "src/dragDropFile/module";

@NgModule({
  imports: [
    CommonModule,
    MatDialogModule,
    FormsModule,
    MatInputModule,
    MatButtonModule,
    DragDropFileModule,
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