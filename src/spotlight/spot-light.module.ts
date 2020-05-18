import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SlSpotlightDirective } from './sl-spotlight.directive';
import { SpotlightBackdropComponent } from './spotlight-backdrop/spotlight-backdrop.component';
import { SpotLightOverlayDirective } from './spot-light-overlay.directive';
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";

@NgModule({
  declarations: [
    SlSpotlightDirective,
    SpotlightBackdropComponent,
    SpotLightOverlayDirective
  ],
  imports: [
    BrowserAnimationsModule,
    CommonModule
  ],
  exports:[
    SlSpotlightDirective
  ],
  entryComponents: [
    SpotlightBackdropComponent
  ]
})
export class SpotLightModule { }
