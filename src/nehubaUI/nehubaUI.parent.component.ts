import { Component,AfterViewInit } from '@angular/core'
import { EventPacket } from './nehuba.model'
import { EventCenter,EVENTCENTER_CONST } from './nehubaUI.services'

@Component({
    selector : '#ATLASContainer',
    template : `
      <atlasbanner>
      </atlasbanner>

      <atlascontrol (emitHideUI)="controlUI($event)">
      </atlascontrol>
      <ATLASViewer (emitHideUI)="controlUI($event)" [hideUI]="hideUI" id = "ATLASViewer" [ngStyle]="{'grid-row-start': hideUI ? '1' : '2','grid-row-end': hideUI ? 'span 2' : 'span 1','grid-column-start': hideUI ? '1' : '2','grid-column-end' : hideUI ? 'span 2' : 'span 1'}">
      </ATLASViewer>
      <FloatingWidgetContainer>
      </FloatingWidgetContainer>
    `,
    host : {'[class.darktheme]':'darktheme'}
})

export class NehubaContainer implements AfterViewInit {
  hideUI = false
  darktheme = false

  constructor(private eventCenter : EventCenter){
    this.eventCenter.globalLayoutRelay.subscribe((msg:EventPacket)=>{
      switch(msg.target){
        case EVENTCENTER_CONST.GLOBALLAYOUT.TARGET.THEME:{
            this.darktheme = msg.body.theme == 'dark' 
        }break;
      }
    })
  }

  ngAfterViewInit(){
    window.location.hash = ''
  }

  controlUI(ev:any){
    this.hideUI = ev.hideUI
  }
}