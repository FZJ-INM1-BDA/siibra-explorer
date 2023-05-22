import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AtlasDownloadDirective } from './atlas-download.directive';


@NgModule({
  declarations: [
    AtlasDownloadDirective
  ],
  imports: [
    CommonModule,
  ],
  exports: [
    AtlasDownloadDirective
  ]
})
export class AtlasDownloadModule { }
