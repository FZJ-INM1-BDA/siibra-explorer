import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { HoverableBlockDirective } from "./hoverableBlock.directive";

@NgModule({
  imports: [
    CommonModule,
  ],
  declarations: [
    HoverableBlockDirective,
  ],
  exports: [
    HoverableBlockDirective
  ]
})

export class HoverableModule{}