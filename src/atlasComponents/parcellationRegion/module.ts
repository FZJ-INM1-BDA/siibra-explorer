import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { ComponentsModule } from "src/components";
import { AngularMaterialModule } from "src/sharedModules";
import { UtilModule } from "src/util";
import { RenderViewOriginDatasetLabelPipe } from "./region.base";
import { RegionDirective } from "./region.directive";
import { SimpleRegionComponent } from "./regionSimple/regionSimple.component";
import { RegionAccordionTooltipTextPipe } from "./regionAccordionTooltipText.pipe";
import { AtlasCmptConnModule } from "../connectivity";
import { HttpClientModule } from "@angular/common/http";
import { RegionInOtherTmplPipe } from "./regionInOtherTmpl.pipe";
import { SiibraExplorerTemplateModule } from "../template";

@NgModule({
  imports: [
    CommonModule,
    UtilModule,
    AngularMaterialModule,
    ComponentsModule,
    AtlasCmptConnModule,
    HttpClientModule,
    SiibraExplorerTemplateModule,

  ],
  declarations: [
    SimpleRegionComponent,

    RegionDirective,
    RenderViewOriginDatasetLabelPipe,
    RegionAccordionTooltipTextPipe,
    RegionInOtherTmplPipe,
  ],
  exports: [
    SimpleRegionComponent,

    RegionDirective,
    RenderViewOriginDatasetLabelPipe,
  ]
})

export class ParcellationRegionModule{}