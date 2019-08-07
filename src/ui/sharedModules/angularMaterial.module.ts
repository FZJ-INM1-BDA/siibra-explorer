import {
  MatButtonModule,
  MatCheckboxModule,
  MatSidenavModule,
  MatCardModule,
  MatTabsModule,
  MatTooltipModule,
  MatSlideToggleModule
} from '@angular/material';
import { NgModule } from '@angular/core';

@NgModule({
  imports: [MatSlideToggleModule, MatButtonModule, MatCheckboxModule, MatSidenavModule, MatCardModule, MatTabsModule, MatTooltipModule],
  exports: [MatSlideToggleModule, MatButtonModule, MatCheckboxModule, MatSidenavModule, MatCardModule, MatTabsModule, MatTooltipModule],
})
export class AngularMaterialModule { }