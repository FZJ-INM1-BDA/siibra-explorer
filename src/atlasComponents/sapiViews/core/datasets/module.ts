import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { MarkdownModule } from "src/components/markdown";
import { AngularMaterialModule } from "src/sharedModules";
import { StrictLocalModule } from "src/strictLocal";
import { SapiViewsUtilModule } from "../../util/module";
import { DatasetView } from "./dataset/dataset.component";

@NgModule({
  imports: [
    CommonModule,
    AngularMaterialModule,
    MarkdownModule,
    SapiViewsUtilModule,
    StrictLocalModule,
  ],
  declarations: [
    DatasetView,
  ],
  exports: [
    DatasetView
  ]
})

export class SapiViewsCoreDatasetModule{}