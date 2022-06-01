import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { ComponentsModule } from "../components/components.module";
import { CurrentLayout } from "./currentLayout/currentLayout.component";
import { FourCornersCmp } from "./fourCorners/fourCorners.component";
import { FourPanelLayout } from "./layouts/fourPanel/fourPanel.component";
import { HorizontalOneThree } from "./layouts/h13/h13.component";
import { SinglePanel } from "./layouts/single/single.component";
import { VerticalOneThree } from "./layouts/v13/v13.component";

@NgModule({
  imports : [
    BrowserAnimationsModule,
    BrowserModule,
    ComponentsModule,
  ],
  declarations : [
    FourCornersCmp,
    CurrentLayout,

    FourPanelLayout,
    HorizontalOneThree,
    SinglePanel,
    VerticalOneThree,
  ],
  exports : [
    BrowserAnimationsModule,
    FourCornersCmp,
    CurrentLayout,
    FourPanelLayout,
    HorizontalOneThree,
    SinglePanel,
    VerticalOneThree,
  ],
})

export class LayoutModule {}
