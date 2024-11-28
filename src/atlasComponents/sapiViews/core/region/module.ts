import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { MarkdownModule } from "src/components/markdown";
import { ReadmoreModule } from "src/components/readmore";
import { SpinnerModule } from "src/components/spinner";
import { AngularMaterialModule } from "src/sharedModules";
import { StrictLocalModule } from "src/strictLocal";
import { SapiViewsUtilModule } from "../../util/module";
import { SapiViewsCoreRegionRegionListItem } from "./region/listItem/region.listItem.component";
import { SapiViewsCoreRegionRegionBase } from "./region/region.base.directive";
import { DialogModule } from "src/ui/dialogInfo";
import { SapiViewsCoreParcellationModule } from "../parcellation";
import { TranslateQualificationPipe } from "./translateQualification.pipe";
import { DedupRelatedRegionPipe } from "./dedupRelatedRegion.pipe";
import { ExperimentalFlagDirective } from "src/experimental/experimental-flag.directive";
import { CodeSnippet } from "src/atlasComponents/sapi/codeSnippets/codeSnippet.directive";

@NgModule({
  imports: [
    CommonModule,
    AngularMaterialModule,
    SapiViewsUtilModule,
    SpinnerModule,
    MarkdownModule,
    StrictLocalModule,
    ReadmoreModule,
    DialogModule,
    SapiViewsCoreParcellationModule,

    ExperimentalFlagDirective,
    CodeSnippet,
  ],
  declarations: [
    SapiViewsCoreRegionRegionListItem,
    SapiViewsCoreRegionRegionBase,
    
    TranslateQualificationPipe,
    DedupRelatedRegionPipe,
  ],
  exports: [
    SapiViewsCoreRegionRegionListItem,
    SapiViewsCoreRegionRegionBase,
    TranslateQualificationPipe,
    DedupRelatedRegionPipe,
  ]
})

export class SapiViewsCoreRegionModule{}
