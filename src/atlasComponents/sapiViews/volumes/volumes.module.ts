import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PointAssignmentComponent } from './point-assignment/point-assignment.component';
import { UtilModule } from 'src/util';
import { SpinnerModule } from 'src/components/spinner';
import { ZipFilesOutputModule } from 'src/zipFilesOutput/module';
import { SandsToNumPipe } from "./sandsToNum.pipe"
import { SapiViewsUtilModule } from '../util';
import { AngularMaterialModule } from 'src/sharedModules';
import { MarkdownModule } from 'src/components/markdown';
import { ShareModule } from 'src/share';



@NgModule({
  declarations: [
    PointAssignmentComponent,
    SandsToNumPipe,
  ],
  imports: [
    CommonModule,
    UtilModule,
    SpinnerModule,
    ZipFilesOutputModule,
    SapiViewsUtilModule,
    AngularMaterialModule,
    MarkdownModule,
    ShareModule,
  ],
  exports: [
    PointAssignmentComponent,
    SandsToNumPipe,
  ]
})
export class VolumesModule { }
