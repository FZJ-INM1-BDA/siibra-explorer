import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PointAssignmentComponent } from './point-assignment/point-assignment.component';
import { MatTableModule } from '@angular/material/table';
import { UtilModule } from 'src/util';
import { SpinnerModule } from 'src/components/spinner';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatSortModule } from '@angular/material/sort';
import { ZipFilesOutputModule } from 'src/zipFilesOutput/module';
import { SandsToNumPipe } from "./sandsToNum.pipe"
import { SapiViewsUtilModule } from '../util';
import { MatTooltipModule } from '@angular/material/tooltip';



@NgModule({
  declarations: [
    PointAssignmentComponent,
    SandsToNumPipe,
  ],
  imports: [
    CommonModule,
    MatTableModule,
    UtilModule,
    SpinnerModule,
    MatDialogModule,
    MatButtonModule,
    MatSortModule,
    ZipFilesOutputModule,
    SapiViewsUtilModule,
    MatTooltipModule,
  ],
  exports: [
    PointAssignmentComponent
  ]
})
export class VolumesModule { }
