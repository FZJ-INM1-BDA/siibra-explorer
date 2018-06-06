import { NgModule } from "@angular/core";
import { LayoutMainSide } from "./mainside/mainside.component";
import { LayoutsExample } from "./layoutsExample/layoutsExample.component";
import { BrowserModule } from "@angular/platform-browser";
import { ComponentsModule } from "../components/components.module";


@NgModule({
  imports : [
    BrowserModule,
    ComponentsModule
  ],
  declarations : [
    LayoutMainSide,
    LayoutsExample
  ],
  exports : [
    LayoutMainSide,
    LayoutsExample
  ]
})

export class LayoutModule{}
