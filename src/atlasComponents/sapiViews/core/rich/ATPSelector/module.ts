import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatRippleModule } from "@angular/material/core";
import { MatIconModule } from "@angular/material/icon";
import { MarkdownModule } from "src/components/markdown";
import { SmartChipModule } from "src/components/smartChip";
import { DialogModule } from "src/ui/dialogInfo";
import { UtilModule } from "src/util";
import { SapiViewsCoreParcellationModule } from "src/atlasComponents/sapiViews/core/parcellation";
import { PureATPSelector } from "./pureDumb/pureATPSelector.components";
import { WrapperATPSelector } from "./wrapper/wrapper.component";
import { SAPIModule } from "src/atlasComponents/sapi/module";
import { MatTooltipModule } from "@angular/material/tooltip";
import { QuickTourModule } from "src/ui/quickTour";

@NgModule({
  imports: [
    CommonModule,
    SmartChipModule,
    UtilModule,
    MarkdownModule,
    MatRippleModule,
    MatIconModule,
    MatTooltipModule,
    MatButtonModule,
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
