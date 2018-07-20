import { NgModule, Injector } from "@angular/core";
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { createCustomElement } from '@angular/elements'
import { BrowserModule } from "@angular/platform-browser";
import { FormsModule } from "@angular/forms";
import { BsDropdownModule } from "ngx-bootstrap/dropdown";
import { ReadmoreComponent } from "../components/readmoore/readmore.component";
import { MarkdownDom } from '../components/markdown/markdown.component'
import { SafeHtmlPipe } from "../util/pipes/safeHtml.pipe";
import { SampleBoxUnit } from "./sampleBox/sampleBox.component";
import { PanelComponent } from "../components/panel/panel.component";
import { HoverableBlockDirective } from "../components/hoverableBlock.directive";
import { TreeComponent } from "../components/tree/tree.component";
import { TreeSearchPipe } from "../util/pipes/treeSearch.pipe";
import { TreeBaseDirective } from "../components/tree/treeBase.directive";
import { ParseAttributeDirective } from "../components/parseAttribute.directive";
import { ComponentsModule } from "../components/components.module";

@NgModule({
  imports : [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    ComponentsModule,
    BsDropdownModule.forRoot()
  ],
  declarations : [
    SampleBoxUnit,

    /* parse element attributes from string to respective datatypes */
    ParseAttributeDirective
  ],
  entryComponents : [
    SampleBoxUnit,

    ReadmoreComponent,
    MarkdownDom,
    TreeComponent,
    PanelComponent
  ]
})

export class ExportModule{
  constructor(public injector:Injector){
    const SampleBox = createCustomElement(SampleBoxUnit,{injector:this.injector})
    customElements.define('sample-box',SampleBox)

    const ReadMore = createCustomElement(ReadmoreComponent,{ injector : this.injector })
    customElements.define('readmore-element',ReadMore)

    const MarkDown = createCustomElement(MarkdownDom,{injector : this.injector })
    customElements.define('markdown-element',MarkDown)

    const Panel = createCustomElement(PanelComponent,{injector : this.injector })
    customElements.define('panel-element',Panel)

    const Tree = createCustomElement(TreeComponent,{injector : this.injector })
    customElements.define('tree-element',Tree)

  }
  ngDoBootstrap(){

  }
}