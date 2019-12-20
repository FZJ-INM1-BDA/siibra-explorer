import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { ComponentsModule } from "../components/components.module";
import { FloatingLayoutContainer } from "./floating/floating.component";
import { LayoutsExample } from "./layoutsExample/layoutsExample.component";
import { LayoutMainSide } from "./mainside/mainside.component";

@NgModule({
  imports : [
    BrowserAnimationsModule,
    BrowserModule,
    ComponentsModule,
  ],
  declarations : [
    LayoutMainSide,
    FloatingLayoutContainer,

    LayoutsExample,
  ],
  exports : [
    BrowserAnimationsModule,
    LayoutMainSide,
    FloatingLayoutContainer,

    LayoutsExample,
  ],
})

export class LayoutModule {}
