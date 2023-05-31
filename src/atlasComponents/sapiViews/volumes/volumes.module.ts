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



@NgModule({
  declarations: [
    PointAssignmentComponent
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
  ],
  exports: [
    PointAssignmentComponent
  ]
})
export class VolumesModule { }
