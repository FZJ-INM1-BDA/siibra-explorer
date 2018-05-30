import { NgModule } from '@angular/core'
import { FormsModule } from '@angular/forms'

import { TestComponent } from './test/test.component'
import {  MarkdownDom } from './markdown/markdown.component';
import { ComponentIndex } from './main/main.component';

import { SafeHtmlPipe } from '../util/pipes/safeHtml.pipe'
import { ReadmoreComponent } from './readmoore/readmore.component';
import { BrowserModule } from '@angular/platform-browser';

@NgModule({
  imports : [
    BrowserModule,
    FormsModule
  ],
  declarations : [
    /* components */
    MarkdownDom,
    ComponentIndex,
    ReadmoreComponent,

    /* pipes */
    SafeHtmlPipe
  ],
  exports : [
    MarkdownDom,
    ReadmoreComponent
  ]
})

export class ComponentsModule{

}