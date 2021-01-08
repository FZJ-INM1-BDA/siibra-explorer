import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { AtlasCmptConnModule } from "src/atlasComponents/connectivity";
import { DatabrowserModule } from "src/atlasComponents/databrowserModule";
import { AtlasCmpParcellationModule } from "src/atlasComponents/parcellation";
import { ParcellationRegionModule } from "src/atlasComponents/parcellationRegion";
import { SplashUiModule } from "src/atlasComponents/splashScreen";
import { AtlasCmpUiSelectorsModule } from "src/atlasComponents/uiSelectors";
import { ComponentsModule } from "src/components";
import { LayoutModule } from "src/layouts/layout.module";
import { AngularMaterialModule } from "src/ui/sharedModules/angularMaterial.module";
import { TopMenuModule } from "src/ui/topMenu/module";
import { UtilModule } from "src/util";
import { NehubaModule } from "./nehuba";
import { RegionAccordionTooltipTextPipe } from "./util/regionAccordionTooltipText.pipe";
import { ViewerCmp } from "./viewerCmp/viewerCmp.component";

@NgModule({
  imports: [
    CommonModule,
    NehubaModule,
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
  ],
  declarations: [
    ViewerCmp,

    RegionAccordionTooltipTextPipe,
  ],
  exports: [
    ViewerCmp,
  ],
})

export class ViewerModule{}
