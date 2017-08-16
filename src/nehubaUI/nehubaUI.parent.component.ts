import { Component,OnInit,ViewChild} from '@angular/core'
import { NehubaUIControl } from './nehubaUI.control.component'
import { NehubaBanner } from './nehubaUI.banner.component'
import { NehubaViewerContainer } from './nehubaUI.viewer.component'

@Component({
    selector : '#ATLASContainer',
    template : `
    
      <atlasbanner [darktheme]="nehubaUIControl.darktheme" >
      </atlasbanner>

      <atlascontrol [nehubaViewer]="nehubaViewerContainer.nehubaViewer">
        Loading Atlas Viewer ...
      </atlascontrol>
      <ATLASViewer (click)="temporaryDebounce($event)" [darktheme]="nehubaUIControl.darktheme" id = "ATLASViewer">
      </ATLASViewer>
      <FloatingWidgetContainer>
      </FloatingWidgetContainer>
    `,
})

export class NehubaContainer implements OnInit{

      @ViewChild(NehubaViewerContainer) nehubaViewerContainer : NehubaViewerContainer
      @ViewChild(NehubaBanner) nehubaBanner : NehubaBanner
      @ViewChild(NehubaUIControl) nehubaUIControl : NehubaUIControl

      ngOnInit(){
            
      }

      debounceTimer:number = 0
      temporaryDebounce(ev:any){
        ev.stopPropagation()
        Date.now() - this.debounceTimer < 500 ? ev.stopPropagation() : ev;
        this.debounceTimer = Date.now()
      }  
}