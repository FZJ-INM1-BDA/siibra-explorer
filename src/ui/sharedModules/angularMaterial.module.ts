import {
  MatButtonModule,
  MatCheckboxModule,
  MatSidenavModule,
  MatCardModule,
  MatTabsModule,
  MatTooltipModule, MatMenuModule
} from '@angular/material';
import { NgModule } from '@angular/core';

@NgModule({
  imports: [MatButtonModule, MatCheckboxModule, MatSidenavModule, MatCardModule, MatTabsModule, MatTooltipModule, MatMenuModule],
  exports: [MatButtonModule, MatCheckboxModule, MatSidenavModule, MatCardModule, MatTabsModule, MatTooltipModule, MatMenuModule],
})
export class AngularMaterialModule { }