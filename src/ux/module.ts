import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { RevealAnimationDirective } from "./reveal.animation";

@NgModule({
  imports: [
    CommonModule,
    BrowserAnimationsModule,
  ],
  declarations: [
    RevealAnimationDirective,
  ],
  exports: [
    RevealAnimationDirective,
  ]
})

export class SxplrAnimationModule{}
