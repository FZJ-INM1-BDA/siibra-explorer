import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { AngularMaterialModule } from 'src/ui/sharedModules/angularMaterial.module'

import {AppComponent} from "src/app.component";
import {AppRoutingModule} from "src/app-routing.module";
import {HelpPageComponent} from "src/helpPage/helpPage.component";
import {AtlasViewerModule} from "src/atlasViewer/atlasViewer.module";
import {BrowserModule} from "@angular/platform-browser";
import {RouterModule} from "@angular/router";

@NgModule({
  imports : [
    FormsModule,
    BrowserModule,
    RouterModule,


    AngularMaterialModule,
    AtlasViewerModule,

    AppRoutingModule,

  ],
  declarations : [
    AppComponent,
    HelpPageComponent
  ],
  bootstrap : [
    AppComponent
  ]
})

export class MainModule{}