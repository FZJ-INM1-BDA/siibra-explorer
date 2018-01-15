import { Component,ViewChild ,HostListener,AfterViewInit } from '@angular/core'
import { NehubaUIControl } from './nehubaUI.control.component'
import { UI_CONTROL, EXTERNAL_CONTROL as gExternalControl } from './nehubaUI.services'
import { FloatingWidget } from 'nehubaUI/nehubaUI.floatingWidget.component';

@Component({
    selector : 'div#ATLASContainer',
    template : `
      <div [style.grid-template-columns]="calcGridTemplateColumn()">
        <nehubaModal (fetchedPlugin)="fetchedPlugin($event)" (fetchedSomething)="nehubaUI.fetchedSomething($event)"></nehubaModal>
    
        <atlasbanner>
        </atlasbanner>

        <atlascontrol (emitHideUI)="controlUI($event)">
        </atlascontrol>
        <div id = "atlasResizeSliver" (mousedown)="resizeControlPanel=true" (mousemove)="mousemove($event)" (mouseup)="mouseup()">
        </div>
        <ATLASViewer (emitHideUI)="controlUI($event)" [hideUI]="hideUI" id = "ATLASViewer" [ngStyle]="{'grid-column-start': hideUI ? '1' : '3','grid-column-end' : hideUI ? 'span 3' : 'span 1'}">
        </ATLASViewer>
        <div id = "dockResizeSliver" [hidden]="!hasDockedComponents()" (mousedown)="resizeDockedWidgetPanel=true" (mousemove)="mousemove($event)" (mouseup)="mouseup()">
        </div>
        <DockedWidgetContainer [hidden]="!hasDockedComponents()" [allFloatingWidgets]="floatingWidget.loadedFloatingComponents">
        </DockedWidgetContainer>
        <FloatingWidgetContainer [dockedWidgetPanelWidth]="dockedWidgetPanelWidth" >
        </FloatingWidgetContainer>
      </div>
    `,
    host : {
      '[class.darktheme]':'darktheme'
    }
})

export class NehubaContainer implements AfterViewInit {
  hideUI = false
  darktheme = false
  resizeControlPanel = false
  resizeDockedWidgetPanel = false
  controlPanelWidth = 250
  dockedWidgetPanelWidth = 300

  @ViewChild(NehubaUIControl) nehubaUI : NehubaUIControl 
  @ViewChild(FloatingWidget) floatingWidget : FloatingWidget
  
  // calcGridTemplateColumn = `${this.controlPanelWidth<150?150:this.controlPanelWidth>450?450:this.controlPanelWidth}px 10px auto ${!this.floatingWidget ? false : this.floatingWidget.loadedFloatingComponents.findIndex(c=>!c.floating) >= 0 ? `10px ${this.dockedWidgetPanelWidth < 300 ? this.dockedWidgetPanelWidth : 300 }px` : ''}`

  // @HostBinding('style.grid-template-columns')
  // gridTemplateColumns = this.calcGridTemplateColumn

  constructor(){
    
  }
  
  @HostListener('document:mousemove',['$event'])
  mousemove(ev:any){
    if(this.resizeControlPanel){
      this.controlPanelWidth = /*this.startcontrolPanelWidth + this.startpos -*/ ev.clientX

    }
    if(this.resizeDockedWidgetPanel){
      this.dockedWidgetPanelWidth = window.innerWidth - /*this.startcontrolPanelWidth + this.startpos -*/ ev.clientX
    }
  }

  @HostListener('document:mouseup',['$event'])
  mouseup(){
    this.resizeControlPanel = false
    this.resizeDockedWidgetPanel = false
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

  hasDockedComponents(){
    return !this.floatingWidget ? false : this.floatingWidget.loadedFloatingComponents.findIndex(c=>!c.floating) >= 0
  }

  calcGridTemplateColumn(){
    return this.hasDockedComponents() ? 
      `${this.controlPanelWidth<150?150:this.controlPanelWidth>450?450:this.controlPanelWidth}px 10px auto 10px ${this.dockedWidgetPanelWidth < 300 ? this.dockedWidgetPanelWidth : 300 }px` :
      `${this.controlPanelWidth<150?150:this.controlPanelWidth>450?450:this.controlPanelWidth}px 10px auto`
  }

  controlUI(ev:any){
    this.hideUI = ev.hideUI
  }
}