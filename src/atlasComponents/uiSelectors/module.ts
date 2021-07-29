import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { AngularMaterialModule } from "src/ui/sharedModules/angularMaterial.module";
import { UtilModule } from "src/util";
import { DatabrowserModule } from "src/atlasComponents/databrowserModule";
import { AtlasDropdownSelector } from "./atlasDropdown/atlasDropdown.component";
import { AtlasLayerSelector, GetPreviewUrlPipe } from "./atlasLayerSelector/atlasLayerSelector.component";
import {QuickTourModule} from "src/ui/quickTour/module";

@NgModule({
  imports: [
    CommonModule,
    AngularMaterialModule,
    UtilModule,
    DatabrowserModule,
    QuickTourModule
  ],
  declarations: [
    AtlasDropdownSelector,
    AtlasLayerSelector,
    GetPreviewUrlPipe,
  ],
  exports: [
    AtlasDropdownSelector,
    AtlasLayerSelector,
  ]
})

export class AtlasCmpUiSelectorsModule{}
