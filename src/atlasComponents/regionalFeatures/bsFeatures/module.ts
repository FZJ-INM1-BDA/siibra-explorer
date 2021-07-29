import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { ComponentsModule } from "src/components";
import { AngularMaterialModule } from "src/ui/sharedModules/angularMaterial.module";
import { GenericInfoCmp, GenericInfoModule } from "./genericInfo";
import { BsFeatureIEEGModule } from "./ieeg/module";
import { KgRegionalFeatureModule } from "./kgRegionalFeature";
import { GetBadgeFromFeaturePipe } from "./pipes/getBadgeFromFeature.pipe";
import { RenderRegionalFeatureSummaryPipe } from "./pipes/renderRegionalFeatureSummary.pipe";
import { BSFeatureReceptorModule } from "./receptor";
import { RegionalFeatureWrapperCmp } from "./regionalFeatureWrapper/regionalFeatureWrapper.component";
import { BsFeatureService } from "./service";
import { GENERIC_INFO_INJ_TOKEN } from "./type";

@NgModule({
  imports: [
    AngularMaterialModule,
    CommonModule,
    KgRegionalFeatureModule,
    BSFeatureReceptorModule,
    BsFeatureIEEGModule,
    ComponentsModule,
    GenericInfoModule,
  ],
  declarations: [
    RegionalFeatureWrapperCmp,
    RenderRegionalFeatureSummaryPipe,
    GetBadgeFromFeaturePipe,
  ],
  providers: [
    BsFeatureService,
    {
      provide: GENERIC_INFO_INJ_TOKEN,
      useValue: GenericInfoCmp
    }
  ],
  exports: [
    RegionalFeatureWrapperCmp,
    GenericInfoModule,
  ]
})

export class BSFeatureModule{}
