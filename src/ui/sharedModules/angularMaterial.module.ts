import {MatButtonModule, MatCheckboxModule, MatSidenavModule, MatCardModule, MatTabsModule} from '@angular/material';
import { NgModule } from '@angular/core';

@NgModule({
  imports: [MatButtonModule, MatCheckboxModule, MatSidenavModule, MatCardModule, MatTabsModule],
  exports: [MatButtonModule, MatCheckboxModule, MatSidenavModule, MatCardModule, MatTabsModule],
})
export class AngularMaterialModule { }