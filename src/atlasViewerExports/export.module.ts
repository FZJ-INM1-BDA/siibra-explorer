import { Injector, NgModule } from "@angular/core";
import { createCustomElement } from '@angular/elements'
import { FormsModule } from "@angular/forms";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { BsDropdownModule } from "ngx-bootstrap/dropdown";
import { ComponentsModule } from "../components/components.module";
import { MarkdownDom } from '../components/markdown/markdown.component'
import { PanelComponent } from "../components/panel/panel.component";
import { ParseAttributeDirective } from "../components/parseAttribute.directive";
import { ReadmoreComponent } from "../components/readmoore/readmore.component";
import { TreeComponent } from "../components/tree/tree.component";
import { SampleBoxUnit } from "./sampleBox/sampleBox.component";

@NgModule({
  imports : [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    ComponentsModule,
    BsDropdownModule.forRoot(),
  ],
  declarations : [
    SampleBoxUnit,

    /* parse element attributes from string to respective datatypes */
    ParseAttributeDirective,
  ],
  entryComponents : [
    SampleBoxUnit,

    ReadmoreComponent,
    MarkdownDom,
    TreeComponent,
    PanelComponent,
  ],
})

export class ExportModule {
  constructor(public injector: Injector) {
    const sampleBox = createCustomElement(SampleBoxUnit, {injector: this.injector})
    customElements.define('sample-box', sampleBox)

    const readMore = createCustomElement(ReadmoreComponent, { injector : this.injector })
    customElements.define('readmore-element', readMore)

    const markDown = createCustomElement(MarkdownDom, {injector : this.injector })
    customElements.define('markdown-element', markDown)

    const panel = createCustomElement(PanelComponent, {injector : this.injector })
    customElements.define('panel-element', panel)

    const tree = createCustomElement(TreeComponent, {injector : this.injector })
    customElements.define('tree-element', tree)

  }

  // tslint:disable-next-line:no-empty
  public ngDoBootstrap() {}
}
