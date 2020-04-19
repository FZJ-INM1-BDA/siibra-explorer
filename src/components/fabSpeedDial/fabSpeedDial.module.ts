import { NgModule } from "@angular/core";
import { FabSpeedDialChild } from "./fabSpeedDialChild.directive";
import { FabSpeedDialContainer } from "./fabSpeedDialContainer.directive";
import { FabSpeedDialTrigger } from "./fabSpeedDialTrigger.directive";
import { CommonModule } from "@angular/common";

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [
    FabSpeedDialChild,
    FabSpeedDialContainer,
    FabSpeedDialTrigger
  ],
  exports: [
    FabSpeedDialChild,
    FabSpeedDialContainer,
    FabSpeedDialTrigger
  ]
})

export class FabSpeedDialModule{}
