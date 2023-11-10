import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AtlasDownloadDirective } from './atlas-download.directive';
import { AngularMaterialModule } from 'src/sharedModules';


@NgModule({
  declarations: [
    AtlasDownloadDirective
  ],
  imports: [
    CommonModule,
    AngularMaterialModule,
  ],
  exports: [
    AtlasDownloadDirective
  ]
})
export class AtlasDownloadModule { }
