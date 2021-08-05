import { Injector, NgModule } from "@angular/core";
import { createCustomElement } from '@angular/elements'
import { FormsModule } from "@angular/forms";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { ComponentsModule } from "../components/components.module";
import { MarkdownDom } from '../components/markdown/markdown.component'
import { ParseAttributeDirective } from "../components/parseAttribute.directive";
import { TreeComponent } from "../components/tree/tree.component";
import { SampleBoxUnit } from "./sampleBox/sampleBox.component";

@NgModule({
  imports : [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    ComponentsModule,
  ],
  declarations : [
    SampleBoxUnit,

    /* parse element attributes from string to respective datatypes */
    ParseAttributeDirective,
  ],
  entryComponents : [
    SampleBoxUnit,

    MarkdownDom,
    TreeComponent,
  ],
})

export class ExportModule {
  constructor(public injector: Injector) {
    const sampleBox = createCustomElement(SampleBoxUnit, {injector: this.injector})
    customElements.define('sample-box', sampleBox)

    const markDown = createCustomElement(MarkdownDom, {injector : this.injector })
    customElements.define('markdown-element', markDown)

    const tree = createCustomElement(TreeComponent, {injector : this.injector })
    customElements.define('tree-element', tree)

  }

  /* eslint-disable-next-line @typescript-eslint/no-empty-function */
  public ngDoBootstrap() {}
}
