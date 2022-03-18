import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { SxplrFlatHierarchyModule } from "src/components/flatHierarchy";
import { AngularMaterialModule } from "src/sharedModules";
import { SapiViewsUtilModule } from "../../util";
import { SapiViewsCoreRegionModule } from "../region";
import { HighlightPipe } from "./regionsHierarchy/highlight.pipe";
import { SapiViewsCoreRichRegionsHierarchy } from "./regionsHierarchy/regionsHierarchy.component";
import { SapiViewsCoreRichRegionListSearch } from "./regionsListSearch/regionListSearch.component";

@NgModule({
  imports: [
    CommonModule,
    AngularMaterialModule,
    ReactiveFormsModule,
    SapiViewsCoreRegionModule,
    SxplrFlatHierarchyModule,
    SapiViewsUtilModule,
  ],
  declarations: [
    SapiViewsCoreRichRegionListSearch,
    SapiViewsCoreRichRegionsHierarchy,
    HighlightPipe,
  ],
  exports: [
    SapiViewsCoreRichRegionListSearch,
    SapiViewsCoreRichRegionsHierarchy,
  ]
})

export class SapiViewsCoreRichModule{}