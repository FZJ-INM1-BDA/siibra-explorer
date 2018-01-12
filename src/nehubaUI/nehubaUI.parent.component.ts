import { Component,ViewChild ,HostListener,HostBinding,AfterViewInit } from '@angular/core'
import { NehubaUIControl } from './nehubaUI.control.component'
import { UI_CONTROL, EXTERNAL_CONTROL as gExternalControl } from './nehubaUI.services'
import { FloatingWidgetComponent, FloatingWidget } from 'nehubaUI/nehubaUI.floatingWidget.component';

@Component({
    selector : '#ATLASContainer',
    template : `
      <nehubaModal (fetchedPlugin)="fetchedPlugin($event)" (fetchedSomething)="nehubaUI.fetchedSomething($event)"></nehubaModal>
  
      <atlasbanner>
      </atlasbanner>

      <atlascontrol (emitHideUI)="controlUI($event)">
      </atlascontrol>
      <div id = "atlasResizeSliver" (mousedown)="resize=true" (mousemove)="mousemove($event)" (mouseup)="mouseup()">
      </div>
      <ATLASViewer (emitHideUI)="controlUI($event)" [hideUI]="hideUI" id = "ATLASViewer" [ngStyle]="{'grid-column-start': hideUI ? '1' : '3','grid-column-end' : hideUI ? 'span 3' : 'span 1'}">
      </ATLASViewer>
      <DockedWidgetContainer [dockedWidgets]="dockedWidgets">
      </DockedWidgetContainer>
      <FloatingWidgetContainer>
      </FloatingWidgetContainer>
    `,
    host : {'[class.darktheme]':'darktheme'}
})

export class NehubaContainer implements AfterViewInit {
  hideUI = false
  darktheme = false
  resize = false
  controlMenuWidget = 250
  dockedWidgets : FloatingWidgetComponent[] = []

  @ViewChild(NehubaUIControl) nehubaUI : NehubaUIControl 
  @ViewChild(FloatingWidget) floatingWidget : FloatingWidget

  @HostBinding('style.grid-template-columns')
  gridTemplateColumns = `${this.controlMenuWidget > 150 ? this.controlMenuWidget : 150 }px 10px auto 10px 300px`

  constructor(){
  }
  
  @HostListener('document:mousemove',['$event'])
  mousemove(ev:any){
    if(!this.resize){
      return
    }
    /* may break in chrome */
    this.controlMenuWidget = /*this.startcontrolMenuWidget + this.startpos -*/ ev.clientX
    this.gridTemplateColumns = `${this.controlMenuWidget<150?150:this.controlMenuWidget>450?450:this.controlMenuWidget}px 10px auto`
  }

  @HostListener('document:mouseup',['$event'])
  mouseup(){
    this.resize = false
  }

  ngAfterViewInit(){
    window.location.hash = ''
    UI_CONTROL.afterTemplateSelection(()=>{
      this.darktheme = gExternalControl.metadata.selectedTemplate ? gExternalControl.metadata.selectedTemplate.useTheme == 'dark' : false
      if( this.darktheme ){
        document.body.classList.add('darktheme')
      }else{
        document.body.classList.remove('darktheme')
      }
    })
  }

  controlUI(ev:any){
    this.hideUI = ev.hideUI
  }
}