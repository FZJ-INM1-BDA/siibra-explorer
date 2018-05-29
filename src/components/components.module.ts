import { NgModule } from '@angular/core'
import { BrowserModule } from '@angular/platform-browser'
import { FormsModule } from '@angular/forms'

import { TestComponent } from './test/test.component'
import {  MarkdownDom } from './markdown/markdown.component';
import { ComponentIndex } from './main/main.component';

import { SafeHtmlPipe } from '../util/pipes/safeHtml.pipe'

@NgModule({
  imports : [
    BrowserModule,
    FormsModule
  ],
  declarations : [
    TestComponent,

    /* components */
    MarkdownDom,
    ComponentIndex,

    /* pipes */
    SafeHtmlPipe
  ],
  bootstrap : [
    ComponentIndex
  ]
})

export class ComponentsModule{

}