import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { LayoutModule } from "src/layouts/layout.module";
import { PluginModule } from "src/plugin";
import { AngularMaterialModule } from "src/sharedModules";
import { ConfigComponent } from "./configCmp/config.component";

@NgModule({
  imports: [
    CommonModule,
    AngularMaterialModule,
    PluginModule,
    LayoutModule,
  ],
  declarations: [
    ConfigComponent,
  ],
  exports: [
    ConfigComponent,
  ]
})
export class ConfigModule{}