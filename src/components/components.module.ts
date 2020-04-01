import { ScrollingModule } from '@angular/cdk/scrolling'
import { NgModule } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'

import {  MarkdownDom } from './markdown/markdown.component';

import { CommonModule } from '@angular/common';
import { AngularMaterialModule } from 'src/ui/sharedModules/angularMaterial.module';
import { UtilModule } from 'src/util/util.module';
import { SearchResultPaginationPipe } from '../util/pipes/pagination.pipe';
import { SafeHtmlPipe } from '../util/pipes/safeHtml.pipe'
import { TreeSearchPipe } from '../util/pipes/treeSearch.pipe';
import { ConfirmDialogComponent } from './confirmDialog/confirmDialog.component';
import { DialogComponent } from './dialog/dialog.component';
import { AppendSiblingFlagPipe } from './flatTree/appendSiblingFlag.pipe';
import { ClusteringPipe } from './flatTree/clustering.pipe';
import { FilterCollapsePipe } from './flatTree/filterCollapse.pipe';
import { FlattenTreePipe } from './flatTree/flattener.pipe';
import { FlatTreeComponent } from './flatTree/flatTree.component';
import { HighlightPipe } from './flatTree/highlight.pipe';
import { RenderPipe } from './flatTree/render.pipe';
import { HoverableBlockDirective } from './hoverableBlock.directive';
import { PaginationComponent } from './pagination/pagination.component';
import { PanelComponent } from './panel/panel.component';
import { PillComponent } from './pill/pill.component';
import { ProgressBar } from './progress/progress.component';
import { RadioList } from './radiolist/radiolist.component';
import { ReadmoreComponent } from './readmoore/readmore.component';
import { SleightOfHand } from './sleightOfHand/soh.component';
import { TimerComponent } from './timer/timer.component';
import { TreeComponent } from './tree/tree.component';
import { TreeBaseDirective } from './tree/treeBase.directive';

@NgModule({
  imports : [
    CommonModule,
    ScrollingModule,
    FormsModule,
    BrowserAnimationsModule,
    AngularMaterialModule,
    UtilModule,
  ],
  declarations : [
    /* components */
    MarkdownDom,
    ReadmoreComponent,
    TreeComponent,
    PanelComponent,
    PaginationComponent,
    FlatTreeComponent,
    TimerComponent,
    PillComponent,
    RadioList,
    ProgressBar,
    SleightOfHand,
    DialogComponent,
    ConfirmDialogComponent,

    /* directive */
    HoverableBlockDirective,
    TreeBaseDirective,

    /* pipes */
    SafeHtmlPipe,
    SearchResultPaginationPipe,
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

    MarkdownDom,
    ReadmoreComponent,
    TreeComponent,
    PanelComponent,
    PaginationComponent,
    FlatTreeComponent,
    TimerComponent,
    PillComponent,
    RadioList,
    ProgressBar,
    SleightOfHand,
    DialogComponent,
    ConfirmDialogComponent,

    SearchResultPaginationPipe,
    TreeSearchPipe,

    HoverableBlockDirective,
    TreeBaseDirective,
  ],
})

export class ComponentsModule {

}
