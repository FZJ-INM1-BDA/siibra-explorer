import {
  MatButtonModule,
  MatCheckboxModule,
  MatSidenavModule,
  MatCardModule,
  MatTabsModule,
  MatTooltipModule,
  MatSlideToggleModule,
  MatDialogModule, 
} from '@angular/material';
import { NgModule } from '@angular/core';

@NgModule({
  imports: [MatDialogModule, MatSlideToggleModule, MatButtonModule, MatCheckboxModule, MatSidenavModule, MatCardModule, MatTabsModule, MatTooltipModule],
  exports: [MatDialogModule, MatSlideToggleModule, MatButtonModule, MatCheckboxModule, MatSidenavModule, MatCardModule, MatTabsModule, MatTooltipModule],
})
export class AngularMaterialModule { }