import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatDialogModule } from "@angular/material/dialog";
import { MarkdownModule } from "src/components/markdown";
import { StrictLocalModule } from "src/strictLocal";
import { DialogDirective } from "./dialog.directive"
import { DialogFallbackCmp } from "./tmpl/tmpl.component";
import { MatListModule } from "@angular/material/list";
import { ExperimentalModule } from "src/experimental/experimental.module";

@NgModule({
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MarkdownModule,
    StrictLocalModule,
    MatListModule,
    ExperimentalModule,
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
