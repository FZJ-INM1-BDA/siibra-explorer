import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { Observable } from "rxjs";
import { AtlasCmptConnModule } from "src/atlasComponents/connectivity";
import { DatabrowserModule } from "src/atlasComponents/databrowserModule";
import { AtlasCmpParcellationModule } from "src/atlasComponents/parcellation";
import { ParcellationRegionModule } from "src/atlasComponents/parcellationRegion";
import { BSFeatureModule, BS_DARKTHEME,  } from "src/atlasComponents/regionalFeatures/bsFeatures";
import { SplashUiModule } from "src/atlasComponents/splashScreen";
import { AtlasCmpUiSelectorsModule } from "src/atlasComponents/uiSelectors";
import { ComponentsModule } from "src/components";
import { LayoutModule } from "src/layouts/layout.module";
import { AngularMaterialModule } from "src/ui/sharedModules/angularMaterial.module";
import { TopMenuModule } from "src/ui/topMenu/module";
import { UtilModule } from "src/util";
import { VIEWERMODULE_DARKTHEME } from "./constants";
import { NehubaModule } from "./nehuba";
import { ThreeSurferModule } from "./threeSurfer";
import { RegionAccordionTooltipTextPipe } from "./util/regionAccordionTooltipText.pipe";
import { ViewerCmp } from "./viewerCmp/viewerCmp.component";
import {QuickTourModule} from "src/ui/quickTour/module";

@NgModule({
  imports: [
    CommonModule,
    NehubaModule,
    ThreeSurferModule,
    LayoutModule,
    DatabrowserModule,
    AtlasCmpUiSelectorsModule,
    AngularMaterialModule,
    SplashUiModule,
    TopMenuModule,
    ParcellationRegionModule,
    UtilModule,
    AtlasCmpParcellationModule,
    AtlasCmptConnModule,
    ComponentsModule,
    BSFeatureModule,
    QuickTourModule,
  ],
  declarations: [
    ViewerCmp,
    RegionAccordionTooltipTextPipe,
  ],
  providers: [
    {
      provide: BS_DARKTHEME,
      useFactory: (obs$: Observable<boolean>) => obs$,
      deps: [
        VIEWERMODULE_DARKTHEME
      ]
    }
  ],
  exports: [
    ViewerCmp,
  ],
})

export class ViewerModule{}
