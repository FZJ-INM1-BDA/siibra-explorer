import { CommonModule } from "@angular/common";
import { Inject, NgModule, Optional } from "@angular/core";
import { AngularMaterialModule } from "src/ui/sharedModules/angularMaterial.module";
import { KgRegSummaryCmp } from "./kgRegSummary/kgRegSummary.component";
import { KgRegionalFeaturesList } from "./kgRegList/kgRegList.component";
import { KgRegionalFeaturesListDirective } from "./kgRegList/kgReglist.directive";
import { KgDatasetModule } from "../kgDataset";
import { UtilModule } from "src/util";
import { ComponentsModule } from "src/components";
import { BsFeatureService } from "../service";
import { EbrainsRegionalFeatureName } from "./type";
import { GENERIC_INFO_INJ_TOKEN } from "../type";

@NgModule({
  imports: [
    CommonModule,
    AngularMaterialModule,
    KgDatasetModule,
    UtilModule,
    ComponentsModule,
  ],
  declarations:[
    KgRegSummaryCmp,
    KgRegionalFeaturesList,
    KgRegionalFeaturesListDirective,
  ],
  exports:[
    KgRegSummaryCmp,
    KgRegionalFeaturesList,
    KgRegionalFeaturesListDirective,
  ],
})

export class KgRegionalFeatureModule{
  constructor(
    svc: BsFeatureService,
    @Optional() @Inject(GENERIC_INFO_INJ_TOKEN) Cmp: any
  ){
    if (!Cmp) {
      console.warn(`GENERIC_INFO_INJ_TOKEN not injected!`)
      return
    }
    svc.registerFeature({
      name: EbrainsRegionalFeatureName,
      icon: 'fas fa-ellipsis-h',
      View: null,
      Ctrl: KgRegionalFeaturesListDirective,
    })
  }
}
