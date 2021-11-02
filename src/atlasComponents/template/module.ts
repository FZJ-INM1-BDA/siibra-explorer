import { NgModule } from "@angular/core";
import { GetTemplatePreviewUrlPipe } from "./getTemplatePreviewUrl.pipe";
import { TemplateIsDarkThemePipe } from "./templateIsDarkTheme.pipe";

@NgModule({
  imports: [],
  declarations: [
    GetTemplatePreviewUrlPipe,
    TemplateIsDarkThemePipe,
  ],
  exports: [
    GetTemplatePreviewUrlPipe,
    TemplateIsDarkThemePipe,
  ]
})

export class SiibraExplorerTemplateModule{}