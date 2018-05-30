import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { ComponentsModule } from "../components/components.module";

import { NehubaViewerUnit } from "./nehubaContainer/nehubaViewer/nehubaViewer.component";
import { NehubaContainner } from "./nehubaContainer/nehubaContainer.component";
import { SplashScreen } from "./nehubaContainer/splashScreen/splashScreen.component";


@NgModule({
  imports : [
    BrowserModule,
  ],
  declarations : [
    NehubaContainner,
    NehubaViewerUnit,
    SplashScreen
  ],
  entryComponents : [

    /* dynamically created components needs to be declared here */
    NehubaViewerUnit
  ],
  exports : [
    NehubaContainner,
    NehubaViewerUnit
  ]
})

export class UIModule{

}