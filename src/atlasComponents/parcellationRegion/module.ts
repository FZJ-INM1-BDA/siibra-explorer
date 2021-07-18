import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { ComponentsModule } from "src/components";
import { DatabrowserModule } from "src/atlasComponents/databrowserModule";
import { AngularMaterialModule } from "src/ui/sharedModules/angularMaterial.module";
import { UtilModule } from "src/util";
import { RenderViewOriginDatasetLabelPipe } from "./region.base";
import { RegionDirective } from "./region.directive";
import { RegionListSimpleViewComponent } from "./regionListSimpleView/regionListSimpleView.component";
import { RegionMenuComponent } from "./regionMenu/regionMenu.component";
import { SimpleRegionComponent } from "./regionSimple/regionSimple.component";
import { BSFeatureModule } from "../regionalFeatures/bsFeatures";
import { RegionAccordionTooltipTextPipe } from "./regionAccordionTooltipText.pipe";
import { AtlasCmptConnModule } from "../connectivity";

@NgModule({
  imports: [
    CommonModule,
    UtilModule,
    DatabrowserModule,
    AngularMaterialModule,
    ComponentsModule,
    BSFeatureModule,
    AtlasCmptConnModule,
  ],
  declarations: [
    RegionMenuComponent,
    RegionListSimpleViewComponent,
    SimpleRegionComponent,

    RegionDirective,
    RenderViewOriginDatasetLabelPipe,
    RegionAccordionTooltipTextPipe,
  ],
  exports: [
    RegionMenuComponent,
    RegionListSimpleViewComponent,
    SimpleRegionComponent,

    RegionDirective,
    RenderViewOriginDatasetLabelPipe,
  ]
})

export class ParcellationRegionModule{}