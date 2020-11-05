import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { UtilModule } from "src/util";
import { AngularMaterialModule } from "../sharedModules/angularMaterial.module";
import { FeatureExplorer } from "./featureExplorer/featureExplorer.component";
import { RegionalFeatureInteractivity } from "./interactivity.directive";
import { FilterRegionalFeaturesByTypePipe } from "./pipes/filterRegionalFeaturesByType.pipe";
import { FindRegionFEatureById } from "./pipes/findRegionFeatureById.pipe";
import { RegionalFeaturesService } from "./regionalFeature.service";
import { RegionalFeaturesCmp } from "./regionalFeaturesCmp/regionalFeaturesCmp.component";

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
    RegionalFeaturesCmp,
    FeatureExplorer,

    /**
     * Directives
     */
    RegionalFeatureInteractivity,

    /**
     * pipes
     */
    FilterRegionalFeaturesByTypePipe,
    FindRegionFEatureById,
  ],
  exports: [
    RegionalFeaturesCmp,
  ],
  providers: [
    RegionalFeaturesService,
  ]
})

export class RegionalFeaturesModule{}
