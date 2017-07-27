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
      <ATLASViewer [darktheme]="nehubaUIControl.darktheme" id = "ATLASViewer">
        <div id="container"></div>
      </ATLASViewer>
    `,
})

export class NehubaContainer implements OnInit{

      @ViewChild(NehubaViewerContainer) nehubaViewerContainer : NehubaViewerContainer
      @ViewChild(NehubaBanner) nehubaBanner : NehubaBanner
      @ViewChild(NehubaUIControl) nehubaUIControl : NehubaUIControl

      ngOnInit(){
            
      }
}