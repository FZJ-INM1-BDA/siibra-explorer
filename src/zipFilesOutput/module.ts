import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { SingleFileOutput } from "./downloadSingleFile.directive";
import { ZipFilesOutput } from "./zipFilesOutput.directive";

@NgModule({
  imports: [
    CommonModule,
  ],
  declarations: [
    ZipFilesOutput,
    SingleFileOutput,
  ],
  exports: [
    ZipFilesOutput,
    SingleFileOutput,
  ]
})

export class ZipFilesOutputModule{}

export { TZipFileConfig } from './type'