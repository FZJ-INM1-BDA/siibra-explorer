import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { AngularMaterialModule } from "src/sharedModules";
import { UtilModule } from "src/util";
import { AtlasDropdownSelector } from "./atlasDropdown/atlasDropdown.component";
import { AtlasLayerSelector, GetPreviewUrlPipe } from "./atlasLayerSelector/atlasLayerSelector.component";
import {QuickTourModule} from "src/ui/quickTour/module";
import { KgDatasetModule } from "../regionalFeatures/bsFeatures/kgDataset";

@NgModule({
  imports: [
    CommonModule,
    AngularMaterialModule,
    UtilModule,
    QuickTourModule,
    KgDatasetModule,
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
