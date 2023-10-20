import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { MarkdownModule } from "src/components/markdown";
import { StrictLocalModule } from "src/strictLocal";
import { DialogDirective } from "./dialog.directive"
import { DialogFallbackCmp } from "./tmpl/tmpl.component";
import { ExperimentalModule } from "src/experimental/experimental.module";
import { AngularMaterialModule } from "src/sharedModules";

@NgModule({
  imports: [
    CommonModule,
    MarkdownModule,
    StrictLocalModule,
    ExperimentalModule,
    AngularMaterialModule,
  ],
  declarations: [
    DialogDirective,
    DialogFallbackCmp,
  ],
  exports: [
    DialogDirective,
  ],
})

export class DialogModule{}
