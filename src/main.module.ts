import { NgModule } from "@angular/core";
import { ComponentsModule } from "./components/components.module";
import { UIModule } from "./ui/ui.module";
import { Serv } from "./services/services.module";
import { LayoutModule } from "./layouts/layout.module";
import { Examples } from "./examples/examples.component";
import { AtlasViewer } from "./atlasViewer/atlasViewer.component";
import { StoreModule } from "@ngrx/store";
import { changeState, newViewer } from "./services/stateStore.service";
import { AtlasBanner } from "./ui/banner/banner.component";
import { GetNamesPipe } from "./util/pipes/getNames.pipe";
import { CommonModule } from "@angular/common";
import { GetNamePipe } from "./util/pipes/getName.pipe";
import { FormsModule } from "@angular/forms";

import { PopoverModule } from 'ngx-bootstrap/popover'

@NgModule({
  imports : [
    FormsModule,
    CommonModule,
    LayoutModule,
    ComponentsModule,
    UIModule,
    
    PopoverModule.forRoot(),
    Serv.forRoot(),
    StoreModule.forRoot({
      viewerState : changeState,
      newViewer : newViewer
    })
  ],
  declarations : [
    AtlasViewer,
    AtlasBanner,

    /* pipes */
    GetNamesPipe,
    GetNamePipe
  ],
  bootstrap : [
    AtlasViewer
  ]
})

export class MainModule{

}