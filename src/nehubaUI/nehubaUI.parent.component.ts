import { Component,AfterViewInit } from '@angular/core'

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
})

export class NehubaContainer implements AfterViewInit {
  hideUI = false

  ngAfterViewInit(){
    window.location.hash = ''
  }

  controlUI(ev:any){
    this.hideUI = ev.hideUI
  }
}