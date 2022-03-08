import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { MarkdownModule } from "src/components/markdown";
import { AngularMaterialModule } from "src/sharedModules";
import { SapiViewsUtilModule } from "../../util/module";
import { DatasetView } from "./dataset/dataset.component";

@NgModule({
  imports: [
    CommonModule,
    AngularMaterialModule,
    MarkdownModule,
    SapiViewsUtilModule
  ],
  declarations: [
    DatasetView,
  ],
  exports: [
    DatasetView
  ]
})

export class SapiViewsCoreDatasetModule{}