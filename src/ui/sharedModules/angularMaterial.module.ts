import {
  MatButtonModule,
  MatCheckboxModule,
  MatSidenavModule,
  MatCardModule,
  MatTabsModule,
  MatTooltipModule,
  MatBadgeModule
} from '@angular/material';
import { NgModule } from '@angular/core';

@NgModule({
  imports: [MatBadgeModule, MatButtonModule, MatCheckboxModule, MatSidenavModule, MatCardModule, MatTabsModule, MatTooltipModule],
  exports: [MatBadgeModule, MatButtonModule, MatCheckboxModule, MatSidenavModule, MatCardModule, MatTabsModule, MatTooltipModule],
})
export class AngularMaterialModule { }