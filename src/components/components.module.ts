import { NgModule } from '@angular/core'
import { FormsModule } from '@angular/forms'

import { BsDropdownModule }  from 'ngx-bootstrap/dropdown';

import {  MarkdownDom } from './markdown/markdown.component';
import { ComponentsExample } from './componentsExample/componentsExample.component';

import { SafeHtmlPipe } from '../util/pipes/safeHtml.pipe'
import { ReadmoreComponent } from './readmoore/readmore.component';
import { BrowserModule } from '@angular/platform-browser';
import { HoverableBlockDirective } from './hoverableBlock.directive';
import { DropdownComponent } from './dropdown/dropdown.component';
import { TreeComponent } from './tree/tree.component';

@NgModule({
  imports : [
    BrowserModule,
    FormsModule,
    BsDropdownModule.forRoot(),
  ],
  declarations : [
    /* components */
    MarkdownDom,
    ComponentsExample,
    ReadmoreComponent,
    DropdownComponent,
    TreeComponent,

    /* directive */
    HoverableBlockDirective,

    /* pipes */
    SafeHtmlPipe
  ],
  exports : [
    MarkdownDom,
    ReadmoreComponent,
    DropdownComponent,
    TreeComponent,

    HoverableBlockDirective,

    ComponentsExample
  ]
})

export class ComponentsModule{

}