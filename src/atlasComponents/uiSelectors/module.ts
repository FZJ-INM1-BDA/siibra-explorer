import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { AngularMaterialModule } from "src/ui/sharedModules/angularMaterial.module";
import { UtilModule } from "src/util";
import { DatabrowserModule } from "src/atlasComponents/databrowserModule";
import { AtlasDropdownSelector } from "./atlasDropdown/atlasDropdown.component";
import { AtlasLayerSelector } from "./atlasLayerSelector/atlasLayerSelector.component";

@NgModule({
  imports: [
    CommonModule,
    AngularMaterialModule,
    UtilModule,
    DatabrowserModule,
  ],
  declarations: [
    AtlasDropdownSelector,
    AtlasLayerSelector,
  ],
  exports: [
    AtlasDropdownSelector,
    AtlasLayerSelector,
  ]
})

export class AtlasCmpUiSelectorsModule{}