import { CommonModule } from "@angular/common";
import { Component, Inject } from "@angular/core";
import { TextareaCopyExportCmp } from "src/components/textareaCopyExport/textareaCopyExport.component";
import { AngularMaterialModule, Clipboard, MAT_DIALOG_DATA } from "src/sharedModules";

@Component({
  templateUrl: './codeSnippet.template.html',
  standalone: true,
  styleUrls: [
    './codeSnippet.style.scss'
  ],
  imports: [
    TextareaCopyExportCmp,
    AngularMaterialModule,
    CommonModule,
  ]
})

export class CodeSnippetCmp {
  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: any,
    public clipboard: Clipboard,
  ){

  }

  copy(){
    this.clipboard.copy(this.data.code)
  }
}
