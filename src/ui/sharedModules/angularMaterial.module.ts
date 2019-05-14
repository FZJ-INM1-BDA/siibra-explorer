import {MatButtonModule, MatCheckboxModule, MatSidenavModule, MatCardModule} from '@angular/material';
import { NgModule } from '@angular/core';

@NgModule({
  imports: [MatButtonModule, MatCheckboxModule, MatSidenavModule, MatCardModule],
  exports: [MatButtonModule, MatCheckboxModule, MatSidenavModule, MatCardModule],
})
export class AngularMaterialModule { }