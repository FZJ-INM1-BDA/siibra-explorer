import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { RevealAnimationDirective } from "./reveal.animation";
import { SlideInAnimation as SlideInAnimationDirective } from "./slideIn.animation";

@NgModule({
  imports: [
    CommonModule,
    BrowserAnimationsModule,
  ],
  declarations: [
    RevealAnimationDirective,
    SlideInAnimationDirective,
  ],
  exports: [
    RevealAnimationDirective,
    SlideInAnimationDirective,
  ]
})

export class SxplrAnimationModule{}
