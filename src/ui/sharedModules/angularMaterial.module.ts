import {
  MatButtonModule,
  MatCheckboxModule,
  MatSidenavModule,
  MatCardModule,
  MatTabsModule,
  MatTooltipModule
} from '@angular/material';
import { NgModule } from '@angular/core';

@NgModule({
  imports: [MatButtonModule, MatCheckboxModule, MatSidenavModule, MatCardModule, MatTabsModule, MatTooltipModule],
  exports: [MatButtonModule, MatCheckboxModule, MatSidenavModule, MatCardModule, MatTabsModule, MatTooltipModule],
})
export class AngularMaterialModule { }