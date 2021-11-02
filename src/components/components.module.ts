import { ScrollingModule } from '@angular/cdk/scrolling'
import { NgModule } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'

import {  MarkdownDom } from './markdown/markdown.component';

import { CommonModule } from '@angular/common';
import { AngularMaterialModule } from 'src/sharedModules';
import { UtilModule } from 'src/util';
import { SafeHtmlPipe } from './safeHtml.pipe'
import { TreeSearchPipe } from './treeSearch.pipe';
import { ConfirmDialogComponent } from './confirmDialog/confirmDialog.component';
import { DialogComponent } from './dialog/dialog.component';
import { AppendSiblingFlagPipe } from './flatTree/appendSiblingFlag.pipe';
import { ClusteringPipe } from './flatTree/clustering.pipe';
import { FilterCollapsePipe } from './flatTree/filterCollapse.pipe';
import { FlattenTreePipe } from './flatTree/flattener.pipe';
import { FlatTreeComponent } from './flatTree/flatTree.component';
import { HighlightPipe } from './flatTree/highlight.pipe';
import { RenderPipe } from './flatTree/render.pipe';
import { TreeComponent } from './tree/tree.component';
import { TreeBaseDirective } from './tree/treeBase.directive';
import { IAVVerticalButton } from './vButton/vButton.component';
import { DynamicMaterialBtn } from './dynamicMaterialBtn/dynamicMaterialBtn.component';
import { SpinnerCmp } from './spinner/spinner.component';
import { ReadmoreModule } from './readmore';
import { TileCmp } from './tile/tile.component';

@NgModule({
  imports : [
    CommonModule,
    ScrollingModule,
    FormsModule,
    BrowserAnimationsModule,
    AngularMaterialModule,
    UtilModule,
    ReadmoreModule,
  ],
  declarations : [
    /* components */
    MarkdownDom,
    TreeComponent,
    FlatTreeComponent,
    DialogComponent,
    ConfirmDialogComponent,
    IAVVerticalButton,
    DynamicMaterialBtn,
    SpinnerCmp,
    TileCmp,

    /* directive */
    TreeBaseDirective,

    /* pipes */
    SafeHtmlPipe,
    TreeSearchPipe,
    FlattenTreePipe,
    RenderPipe,
    HighlightPipe,
    AppendSiblingFlagPipe,
    ClusteringPipe,
    FilterCollapsePipe,
  ],
  exports : [
    BrowserAnimationsModule,
    ReadmoreModule,

    MarkdownDom,
    TreeComponent,
    FlatTreeComponent,
    DialogComponent,
    ConfirmDialogComponent,
    IAVVerticalButton,
    DynamicMaterialBtn,
    SpinnerCmp,
    TileCmp,

    TreeSearchPipe,
    TreeBaseDirective,
  ],
})

export class ComponentsModule {

}
