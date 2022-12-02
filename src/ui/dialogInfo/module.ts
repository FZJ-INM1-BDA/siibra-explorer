import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatDialogModule } from "@angular/material/dialog";
import { MarkdownModule } from "src/components/markdown";
import { StrictLocalModule } from "src/strictLocal";
import { DialogDirective } from "./dialog.directive"
import { DialogFallbackCmp } from "./tmpl/tmpl.component";

@NgModule({
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MarkdownModule,
    StrictLocalModule,
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
