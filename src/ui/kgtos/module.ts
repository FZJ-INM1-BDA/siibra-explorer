import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { ComponentsModule } from "src/components";
import { KGToS } from "./kgtos/kgtos.component";

@NgModule({
  imports: [
    CommonModule,
    ComponentsModule,
  ],
  declarations: [
    KGToS
  ],
  exports: [
    KGToS
  ]
})

export class KgTosModule{}