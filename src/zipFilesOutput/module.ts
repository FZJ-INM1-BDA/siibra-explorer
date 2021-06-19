import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { ZipFilesOutput } from "./zipFilesOutput.directive";

@NgModule({
  imports: [
    CommonModule,
  ],
  declarations: [
    ZipFilesOutput
  ],
  exports: [
    ZipFilesOutput
  ]
})

export class ZipFilesOutputModule{}

export { TZipFileConfig } from './type'