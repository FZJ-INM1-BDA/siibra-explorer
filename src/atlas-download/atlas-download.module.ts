import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AtlasDownloadDirective } from './atlas-download.directive';
import { MatSnackBarModule } from '@angular/material/snack-bar';


@NgModule({
  declarations: [
    AtlasDownloadDirective
  ],
  imports: [
    CommonModule,
    MatSnackBarModule,
  ],
  exports: [
    AtlasDownloadDirective
  ]
})
export class AtlasDownloadModule { }
