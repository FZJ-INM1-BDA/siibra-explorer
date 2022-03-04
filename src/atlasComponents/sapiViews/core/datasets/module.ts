import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { MarkdownModule } from "src/components/markdown";
import { AngularMaterialModule } from "src/sharedModules";
import { DatasetView } from "./dataset/dataset.component";
import { ParseDoiPipe } from "./parseDoi.pipe";

@NgModule({
  imports: [
    CommonModule,
    AngularMaterialModule,
    MarkdownModule,
  ],
  declarations: [
    DatasetView,
    ParseDoiPipe,
  ],
  exports: [
    DatasetView
  ]
})

export class SapiViewsCoreDatasetModule{}