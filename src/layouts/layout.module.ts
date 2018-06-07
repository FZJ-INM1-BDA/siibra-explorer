import { NgModule } from "@angular/core";
import { LayoutMainSide } from "./mainside/mainside.component";
import { LayoutsExample } from "./layoutsExample/layoutsExample.component";
import { BrowserModule } from "@angular/platform-browser";
import { ComponentsModule } from "../components/components.module";
import { FloatingLayoutContainer } from "./floating/floating.component";


@NgModule({
  imports : [
    BrowserModule,
    ComponentsModule
  ],
  declarations : [
    LayoutMainSide,
    FloatingLayoutContainer,

    LayoutsExample
  ],
  exports : [
    LayoutMainSide,
    FloatingLayoutContainer,

    LayoutsExample
  ]
})

export class LayoutModule{}
