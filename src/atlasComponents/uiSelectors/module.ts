import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { AngularMaterialModule } from "src/sharedModules";
import { UtilModule } from "src/util";
import { AtlasDropdownSelector } from "./atlasDropdown/atlasDropdown.component";
import { AtlasLayerSelector } from "./atlasLayerSelector/atlasLayerSelector.component";
import {QuickTourModule} from "src/ui/quickTour/module";
import { KgDatasetModule } from "../regionalFeatures/bsFeatures/kgDataset";
import { AtlaslayerTooltipPipe } from "./pipes/atlasLayerTooltip.pipe";
import { ComponentsModule } from "src/components";
import { GetNonbaseParcPipe } from "./pipes/getNonBaseParc.pipe";
import { GetIndividualParcPipe } from "./pipes/getIndividualParc.pipe";
import { getGroupedParcPipe } from "./pipes/getGroupedParc.pipe";
import { CurrentTmplSupportsParcPipe } from "./pipes/currTmplSupportsParc.pipe";
import { GroupParcSelectedPipe } from "./pipes/groupParcSelected.pipe";
import { GetPreviewUrlPipe } from "./pipes/getPreviewUrl.pipe";
import { CurrParcSupportsTmplPipe } from "./pipes/currParcSupportsTmpl.pipe";
import { AtlasCmpParcellationModule } from "../parcellation";
import { SiibraExplorerTemplateModule } from "../template";

@NgModule({
  imports: [
    CommonModule,
    AngularMaterialModule,
    UtilModule,
    QuickTourModule,
    KgDatasetModule,
    ComponentsModule,
    AtlasCmpParcellationModule,
    SiibraExplorerTemplateModule,
  ],
  declarations: [
    AtlasDropdownSelector,
    AtlasLayerSelector,
    GetPreviewUrlPipe,
    AtlaslayerTooltipPipe,
    GetNonbaseParcPipe,
    GetIndividualParcPipe,
    getGroupedParcPipe,
    CurrentTmplSupportsParcPipe,
    GroupParcSelectedPipe,
    CurrParcSupportsTmplPipe,
  ],
  exports: [
    AtlasDropdownSelector,
    AtlasLayerSelector,
  ]
})

export class AtlasCmpUiSelectorsModule{}
