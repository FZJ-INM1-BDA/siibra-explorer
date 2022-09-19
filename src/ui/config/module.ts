import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { LayoutModule } from "src/layouts/layout.module";
import { PluginModule } from "src/plugin";
import { AngularMaterialModule } from "src/sharedModules";
import {HardwareConfigComponent} from "src/ui/config/hardwareConfig/hardwareConfig.component";
import {ViewerPreferencesComponent} from "src/ui/config/viewerPreferences/viewerPreferences.component";

@NgModule({
  imports: [
    CommonModule,
    AngularMaterialModule,
    // PluginModule,
    LayoutModule,
  ],
  declarations: [
    HardwareConfigComponent,
    ViewerPreferencesComponent
  ],
  exports: [
    HardwareConfigComponent,
    ViewerPreferencesComponent
  ]
})
export class ConfigModule{}