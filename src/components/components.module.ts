import { NgModule } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'

import { BsDropdownModule }  from 'ngx-bootstrap/dropdown';

import {  MarkdownDom } from './markdown/markdown.component';

import { SafeHtmlPipe } from '../util/pipes/safeHtml.pipe'
import { ReadmoreComponent } from './readmoore/readmore.component';
import { BrowserModule } from '@angular/platform-browser';
import { HoverableBlockDirective } from './hoverableBlock.directive';
import { DropdownComponent } from './dropdown/dropdown.component';
import { TreeComponent } from './tree/tree.component';
import { PanelComponent } from './panel/panel.component';
import { PaginationComponent } from './pagination/pagination.component';
import { SearchResultPaginationPipe } from '../util/pipes/pagination.pipe';
import { ToastComponent } from './toast/toast.component';
import { TreeSearchPipe } from '../util/pipes/treeSearch.pipe';
import { TreeBaseDirective } from './tree/treeBase.directive';


@NgModule({
  imports : [
    BrowserModule,
    FormsModule,
    BrowserAnimationsModule,
    BsDropdownModule.forRoot(),
  ],
  declarations : [
    /* components */
    MarkdownDom,
    ReadmoreComponent,
    DropdownComponent,
    TreeComponent,
    PanelComponent,
    PaginationComponent,
    ToastComponent,

    /* directive */
    HoverableBlockDirective,
    TreeBaseDirective,

    /* pipes */
    SafeHtmlPipe,
    SearchResultPaginationPipe,
    TreeSearchPipe,
  ],
  exports : [
    BrowserAnimationsModule,
    
    MarkdownDom,
    ReadmoreComponent,
    DropdownComponent,
    TreeComponent,
    PanelComponent,
    PaginationComponent,
    ToastComponent,

    SearchResultPaginationPipe,
    TreeSearchPipe,

    HoverableBlockDirective,
    TreeBaseDirective,
  ]
})

export class ComponentsModule{

}