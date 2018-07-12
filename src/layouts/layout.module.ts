import { NgModule } from "@angular/core";
import { LayoutMainSide } from "./mainside/mainside.component";
import { LayoutsExample } from "./layoutsExample/layoutsExample.component";
import { BrowserModule } from "@angular/platform-browser";
import { ComponentsModule } from "../components/components.module";
import { FloatingLayoutContainer } from "./floating/floating.component";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";


@NgModule({
  imports : [
    BrowserAnimationsModule,
    BrowserModule,
    ComponentsModule
  ],
  declarations : [
    LayoutMainSide,
    FloatingLayoutContainer,

    LayoutsExample
  ],
  exports : [
    BrowserAnimationsModule,
    LayoutMainSide,
    FloatingLayoutContainer,

    LayoutsExample
  ]
})

export class LayoutModule{}
