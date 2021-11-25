import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { ComponentsModule } from "src/components";
import { AngularMaterialModule } from "src/sharedModules";
import { UtilModule } from "src/util";
import { RenderViewOriginDatasetLabelPipe } from "./region.base";
import { RegionDirective } from "./region.directive";
import { RegionMenuComponent } from "./regionMenu/regionMenu.component";
import { SimpleRegionComponent } from "./regionSimple/regionSimple.component";
import { BSFeatureModule } from "../regionalFeatures/bsFeatures";
import { RegionAccordionTooltipTextPipe } from "./regionAccordionTooltipText.pipe";
import { AtlasCmptConnModule } from "../connectivity";
import { HttpClientModule } from "@angular/common/http";
import { RegionInOtherTmplPipe } from "./regionInOtherTmpl.pipe";
import { SiibraExplorerTemplateModule } from "../template";
import { KgDatasetModule } from "../regionalFeatures/bsFeatures/kgDataset";

@NgModule({
  imports: [
    CommonModule,
    UtilModule,
    AngularMaterialModule,
    ComponentsModule,
    BSFeatureModule,
    AtlasCmptConnModule,
    HttpClientModule,
    SiibraExplorerTemplateModule,
    KgDatasetModule,
  ],
  declarations: [
    RegionMenuComponent,
    SimpleRegionComponent,

    RegionDirective,
    RenderViewOriginDatasetLabelPipe,
    RegionAccordionTooltipTextPipe,
    RegionInOtherTmplPipe,
  ],
  exports: [
    RegionMenuComponent,
    SimpleRegionComponent,

    RegionDirective,
    RenderViewOriginDatasetLabelPipe,
  ]
})

export class ParcellationRegionModule{}