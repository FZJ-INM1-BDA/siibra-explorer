import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { AngularMaterialModule } from "src/ui/sharedModules/angularMaterial.module";
import { KgRegSummaryCmp } from "./kgRegSummary/kgRegSummary.component";
import { KgRegionalFeaturesList } from "./kgRegList/kgRegList.component";
import { KgRegionalFeaturesListDirective } from "./kgRegList/kgReglist.directive";
import { kgRegDetailCmp } from "./kgRegDetail/kgRegDetail.component";
import { KgDatasetModule } from "../kgDataset";
import { IAV_DATASET_SHOW_DATASET_DIALOG_CMP } from "../kgDataset/showDataset/showDataset.directive";
import { UtilModule } from "src/util";

@NgModule({
  imports: [
    CommonModule,
    AngularMaterialModule,
    KgDatasetModule,
    UtilModule,
  ],
  declarations:[
    KgRegSummaryCmp,
    KgRegionalFeaturesList,
    KgRegionalFeaturesListDirective,
    kgRegDetailCmp,
  ],
  exports:[
    KgRegSummaryCmp,
    KgRegionalFeaturesList,
    KgRegionalFeaturesListDirective,
    kgRegDetailCmp,
  ],
  providers: [
    {
      provide: IAV_DATASET_SHOW_DATASET_DIALOG_CMP,
      useValue: kgRegDetailCmp
    }
  ]
})

export class KgRegionalFeatureModule{}
