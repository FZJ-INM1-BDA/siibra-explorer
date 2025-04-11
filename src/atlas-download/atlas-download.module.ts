import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AtlasDownloadDirective } from './atlas-download.directive';
import { DumpDownloadAtlasDownload } from "./dumb-download.directive"
import { AngularMaterialModule } from 'src/sharedModules';
import { DumbAtlasDownload } from './dumb-atlas-download/dumb-atlas-download.component';


@NgModule({
  declarations: [
    AtlasDownloadDirective,
    DumpDownloadAtlasDownload,
    DumbAtlasDownload,
  ],
  imports: [
    CommonModule,
    AngularMaterialModule,
  ],
  exports: [
    AtlasDownloadDirective,
    DumpDownloadAtlasDownload,
    DumbAtlasDownload,
  ]
})
export class AtlasDownloadModule { }
