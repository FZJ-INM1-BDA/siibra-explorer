import { Component,ViewChild ,HostListener,AfterViewInit } from '@angular/core'
import { NehubaUIControl } from './nehubaUI.control.component'
import { UI_CONTROL, EXTERNAL_CONTROL as gExternalControl } from './nehubaUI.services'
import { WidgetsContainer } from './nehubaUI.widgets.component'

@Component({
  selector : 'div#ATLASContainer',
  template : `
    <div [style.grid-template-columns]="calcGridTemplateColumn()" containerDiv>
      <nehubaModal (fetchedPlugin)="fetchedPlugin($event)" (fetchedSomething)="nehubaUI.fetchedSomething($event)"></nehubaModal>
  
      <atlasbanner>
      </atlasbanner>

      <atlascontrol (emitHideUI)="controlUI($event)">
      </atlascontrol>
      <div 
        id = "atlasResizeSliver" 
        (mousedown)="resizeControlPanel=true;enableUIInteraction(false)" 
        (mousemove)="mousemove($event)" 
        (mouseup)="mouseup()">
      </div>
      <ATLASViewer 
        (emitHideUI)="controlUI($event)" 
        [hideUI]="hideUI" 
        id = "ATLASViewer" 
        [ngStyle]="{'grid-column-start': hideUI ? '1' : '3','grid-column-end' : hideUI ? 'span 3' : 'span 1'}">
      </ATLASViewer>
      <div 
        id = "dockResizeSliver" 
        [hidden]="!hasDockedComponents()" 
        (mousedown)="resizeDockedWidgetPanel=true;enableUIInteraction(false)" 
        (mousemove)="mousemove($event)" 
        (mouseup)="mouseup()">
      </div>
      <WidgetsContainer 
        [ngClass]="{'darktheme':darktheme}"
        [style.grid-column-start]="hasDockedComponents() ? '5' : '3'" 
        [hasDockedComponents]="hasDockedComponents()" 
        [dockedWidgetPanelWidth] = "dockedWidgetPanelWidth">
      </WidgetsContainer>
    </div>
  `,
  styles : [
`
div[containerDiv]
{
  height:100%;
  width:100%;
  display:grid;
  grid-template-columns:250px 10px auto;
  grid-template-rows:25% 75%;
}
atlasbanner
{
  grid-column-start:1;
  grid-column-end:span 1;
  grid-row-start:1;
  grid-row-end:span 1;
}

div#atlasResizeSliver
{
  grid-column-start:2;
  grid-column-end:span 1;
  grid-row-start:1;
  grid-row-end:span 2;
  z-index:3;
}
  div#atlasResizeSliver:hover
  {
    cursor:ew-resize;
  }

atlascontrol
{
  grid-column-start:1;
  grid-column-end:span 1;
  grid-row-start:2;
  grid-row-end:span 1;
  z-index:2;
}

div#dockResizeSliver
{
  grid-column-start:4;
  grid-column-end:span 1;
  grid-row-start:1;
  grid-row-end:span 2;
  z-index:3;
}
  div#dockResizeSliver:hover
  {
    cursor:ew-resize;
  }

WidgetsContainer
{
  grid-column-start : 5;
  grid-column-end : span 1;
  grid-row-start : 1;
  grid-row-end : span 2;
}

ATLASViewer
{
  grid-column-start:3;
  grid-column-end:span 1;
  grid-row-start:1;
  grid-row-end:span 2;
  z-index:5;
}
`
  ],
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
  @ViewChild(WidgetsContainer) widgetContainer : WidgetsContainer
  
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
    this.enableUIInteraction(true )
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
    return this.widgetContainer.dockedWidgetContainer.viewContainerRef ? 
      this.widgetContainer.dockedWidgetContainer.viewContainerRef.length > 0 :
      false
    // return true
  }

  calcGridTemplateColumn(){
    return this.hasDockedComponents() ? 
      `${this.controlPanelWidth<150?150:this.controlPanelWidth>450?450:this.controlPanelWidth}px 10px auto 10px ${this.dockedWidgetPanelWidth < 300 ? this.dockedWidgetPanelWidth : 300 }px` :
      `${this.controlPanelWidth<150?150:this.controlPanelWidth>450?450:this.controlPanelWidth}px 10px auto`
  }

  controlUI(ev:any){
    this.hideUI = ev.hideUI
  }

  enableUIInteraction(bool:boolean){
    document.body.style.pointerEvents = bool ? 'all':'none'
    document.body.style.userSelect = bool ? 'initial' : 'none'
  }
}