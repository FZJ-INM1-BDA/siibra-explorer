import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router'
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { FormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout'
import { PopoverModule }  from 'ngx-bootstrap/popover'
import { ModalModule }  from 'ngx-bootstrap/modal'

import { NehubaModal } from './nehubaUI.modal.component'
import { MultilevelSelector } from './nehubaUI.multilevel.component'
import { NehubaUIControl } from './nehubaUI.control.component';
import { NehubaViewerContainer } from './nehubaUI.viewer.component';
import { NehubaContainer } from './nehubaUI.parent.component';
import { NehubaBanner } from './nehubaUI.banner.component';
import { NehubaFetchData } from './nehubaUI.services';
import { SearchPipe,SelectTreePipe,SearchTreePipe,SearchHighlight } from './nehubaUI.util.pipes'

@NgModule({
    imports:[
        FlexLayoutModule,
        BrowserAnimationsModule,
        RouterModule,
        FormsModule,
        BrowserModule,
        PopoverModule.forRoot(),
        ModalModule.forRoot()
    ],
    declarations : [ NehubaContainer,NehubaViewerContainer,NehubaUIControl,NehubaBanner,SearchPipe,SelectTreePipe,SearchTreePipe,SearchHighlight, MultilevelSelector, NehubaModal ],
    bootstrap : [ NehubaContainer ],
    providers : [ NehubaFetchData ]
})
export class NehubaUI{
    
}