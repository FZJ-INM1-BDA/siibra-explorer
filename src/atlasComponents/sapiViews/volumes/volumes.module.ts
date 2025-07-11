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
import { PointAssignmentDirective } from './point-assignment.directive';
import { SimpleAssignmentView } from './assignment-views/simple/assignment-view-simple.component';
import { FullAssignmentView } from './assignment-views/full/assignment-view-full.component';
import { PointAssignmentFull } from './point-assignment-full/point-assignment-full.component';
import { TPBRViewCmp } from 'src/features/TPBRView/TPBRView.component';


@NgModule({
  declarations: [
    PointAssignmentComponent,
    PointAssignmentFull,
    SandsToNumPipe,
    PointAssignmentDirective,
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
    SimpleAssignmentView,
    FullAssignmentView,
    TPBRViewCmp,
  ],
  exports: [
    PointAssignmentComponent,
    PointAssignmentFull,
    SandsToNumPipe,
    PointAssignmentDirective,
  ]
})
export class VolumesModule { }
