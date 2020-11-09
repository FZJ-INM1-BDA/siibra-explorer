import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { UtilModule } from "src/util";
import { AngularMaterialModule } from "../sharedModules/angularMaterial.module";
import { FeatureExplorer } from "./featureExplorer/featureExplorer.component";
import { RegionalFeatureInteractivity } from "./interactivity.directive";
import { FilterRegionalFeaturesByTypePipe } from "./pipes/filterRegionalFeaturesByType.pipe";
import { FilterRegionFeaturesById } from "./pipes/filterRegionFeaturesById.pipe";
import { FindRegionFEatureById } from "./pipes/findRegionFeatureById.pipe";
import { RegionalFeaturesService } from "./regionalFeature.service";
import { RegionGetAllFeaturesDirective } from "./regionGetAllFeatures.directive";

@NgModule({
  imports: [
    CommonModule,
    UtilModule,
    AngularMaterialModule,
  ],
  declarations: [
    /**
     * components
     */
    FeatureExplorer,

    /**
     * Directives
     */
    RegionalFeatureInteractivity,
    RegionGetAllFeaturesDirective,

    /**
     * pipes
     */
    FilterRegionalFeaturesByTypePipe,
    FindRegionFEatureById,
    FilterRegionFeaturesById,
  ],
  exports: [
    FeatureExplorer,
    RegionGetAllFeaturesDirective,
    FilterRegionFeaturesById,
  ],
  providers: [
    RegionalFeaturesService,
  ]
})

export class RegionalFeaturesModule{}
