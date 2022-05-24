import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { MarkdownDom } from "./markdownCmp/markdown.component";

@NgModule({
  imports: [
    CommonModule,
  ],
  declarations: [
    MarkdownDom
  ],
  exports: [
    MarkdownDom
  ]
})

export class MarkdownModule{}
