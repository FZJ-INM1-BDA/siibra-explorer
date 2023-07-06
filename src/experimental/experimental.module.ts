import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExperimentalFlagDirective } from './experimental-flag.directive';



@NgModule({
  declarations: [
    ExperimentalFlagDirective
  ],
  imports: [
    CommonModule
  ],
  exports: [
    ExperimentalFlagDirective
  ]
})
export class ExperimentalModule { }
