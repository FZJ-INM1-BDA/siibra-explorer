import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { MarkdownModule } from "src/components/markdown";
import { SmartChipModule } from "src/components/smartChip";
import { DialogModule } from "src/ui/dialogInfo";
import { UtilModule } from "src/util";
import { SapiViewsCoreParcellationModule } from "src/atlasComponents/sapiViews/core/parcellation";
import { PureATPSelector } from "./pureDumb/pureATPSelector.components";
import { WrapperATPSelector } from "./wrapper/wrapper.component";
import { SAPIModule } from "src/atlasComponents/sapi/module";
import { QuickTourModule } from "src/ui/quickTour";
import { AngularMaterialModule } from "src/sharedModules";

@NgModule({
  imports: [
    CommonModule,
    SmartChipModule,
    UtilModule,
    MarkdownModule,
    AngularMaterialModule,
    DialogModule,
    SAPIModule,
    SapiViewsCoreParcellationModule,
    QuickTourModule,
  ],
  declarations: [
    PureATPSelector,
    WrapperATPSelector,
  ],
  exports: [
    PureATPSelector,
    WrapperATPSelector,
  ]
})

export class ATPSelectorModule{}
