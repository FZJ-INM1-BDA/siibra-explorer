import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { MatChipsModule } from "@angular/material/chips";
import { MatDividerModule } from "@angular/material/divider";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatFormFieldModule } from "@angular/material/form-field";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { SAPIModule } from "src/atlasComponents/sapi/module";
import { SpinnerModule } from "src/components/spinner";
import { IEEGDatasetCmp } from "./ieegDataset/ieegDataset.component";
import { InRoiPipe } from "./inRoi.pipe";

@NgModule({
  imports: [
    CommonModule,
    MatExpansionModule,
    MatChipsModule,
    MatFormFieldModule,
    MatDividerModule,
    BrowserAnimationsModule,
    SpinnerModule,
    SAPIModule,
  ],
  declarations: [
    IEEGDatasetCmp,
    InRoiPipe,
  ],
  exports: [
    IEEGDatasetCmp,
  ]
})

export class SxplrSapiViewsFeaturesIeegModule{}