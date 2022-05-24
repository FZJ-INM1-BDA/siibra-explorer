import { ScrollingModule } from '@angular/cdk/scrolling'
import { NgModule } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'

import { MarkdownModule } from './markdown';

import { CommonModule } from '@angular/common';
import { AngularMaterialModule } from 'src/sharedModules';
import { UtilModule } from 'src/util';
import { SafeHtmlPipe } from './safeHtml.pipe'
import { ConfirmDialogComponent } from './confirmDialog/confirmDialog.component';
import { DialogComponent } from './dialog/dialog.component';
import { IAVVerticalButton } from './vButton/vButton.component';
import { DynamicMaterialBtn } from './dynamicMaterialBtn/dynamicMaterialBtn.component';
import { SpinnerModule } from "./spinner"
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
    SpinnerModule,
    MarkdownModule,
  ],
  declarations : [
    /* components */
    DialogComponent,
    ConfirmDialogComponent,
    IAVVerticalButton,
    DynamicMaterialBtn,
    TileCmp,

    /* pipes */
    SafeHtmlPipe,
  ],
  exports : [
    BrowserAnimationsModule,
    ReadmoreModule,
    SpinnerModule,
    MarkdownModule,
    
    DialogComponent,
    ConfirmDialogComponent,
    IAVVerticalButton,
    DynamicMaterialBtn,
    TileCmp,

  ],
})

export class ComponentsModule {

}
