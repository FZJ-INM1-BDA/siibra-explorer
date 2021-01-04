import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { UtilModule } from "src/util";
import { AngularMaterialModule } from "../../ui/sharedModules/angularMaterial.module";
import { FeatureContainer } from "./featureContainer/featureContainer.component";
import { FilterRegionalFeaturesByTypePipe } from "./pipes/filterRegionalFeaturesByType.pipe";
import { FilterRegionFeaturesById } from "./pipes/filterRegionFeaturesById.pipe";
import { FindRegionFEatureById } from "./pipes/findRegionFeatureById.pipe";
import { RegionalFeaturesService } from "./regionalFeature.service";
import { RegionGetAllFeaturesDirective } from "./regionGetAllFeatures.directive";
import { FeatureIEEGRecordings } from "./singleFeatures/iEEGRecordings/module";
import { ReceptorDensityModule } from "./singleFeatures/receptorDensity/module";

@NgModule({
  imports: [
    CommonModule,
    UtilModule,
    AngularMaterialModule,
    FeatureIEEGRecordings,
    ReceptorDensityModule,
  ],
  declarations: [
    /**
     * components
     */
    FeatureContainer,

    /**
     * Directives
     */
    RegionGetAllFeaturesDirective,

    /**
     * pipes
     */
    FilterRegionalFeaturesByTypePipe,
    FindRegionFEatureById,
    FilterRegionFeaturesById,
  ],
  exports: [
    RegionGetAllFeaturesDirective,
    FilterRegionFeaturesById,
    FeatureContainer,
  ],
  providers: [
    RegionalFeaturesService,
  ]
})

export class RegionalFeaturesModule{}
