import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { SxplrFlatHierarchyModule } from "src/components/flatHierarchy";
import { AngularMaterialModule } from "src/sharedModules";
import { UtilModule } from "src/util";
import { SapiViewsUtilModule } from "../../util";
import { SapiViewsCoreRegionModule } from "../region";
import { HighlightPipe } from "./regionsHierarchy/highlight.pipe";
import { SapiViewsCoreRichRegionsHierarchy } from "./regionsHierarchy/regionsHierarchy.component";
import { SapiViewsCoreRichRegionListSearch } from "./regionsListSearch/regionListSearch.component";
import { SapiViewsCoreRichRegionListTemplateDirective } from "./regionsListSearch/regionListSearchTmpl.directive";
import { DialogModule } from "src/ui/dialogInfo";

@NgModule({
  imports: [
    CommonModule,
    AngularMaterialModule,
    ReactiveFormsModule,
    SapiViewsCoreRegionModule,
    SxplrFlatHierarchyModule,
    SapiViewsUtilModule,
    UtilModule,
    DialogModule,
  ],
  declarations: [
    SapiViewsCoreRichRegionListSearch,
    SapiViewsCoreRichRegionsHierarchy,
    HighlightPipe,
    SapiViewsCoreRichRegionListTemplateDirective,
  ],
  exports: [
    SapiViewsCoreRichRegionListSearch,
    SapiViewsCoreRichRegionListTemplateDirective,
    SapiViewsCoreRichRegionsHierarchy,
  ]
})

export class SapiViewsCoreRichModule{}