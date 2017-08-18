import { Component,OnInit,ViewChild} from '@angular/core'
import { NehubaUIControl } from './nehubaUI.control.component'
import { NehubaBanner } from './nehubaUI.banner.component'

@Component({
    selector : '#ATLASContainer',
    template : `
    
      <atlasbanner>
      </atlasbanner>

      <atlascontrol>
        Loading Atlas Viewer ...
      </atlascontrol>
      <ATLASViewer id = "ATLASViewer">
      </ATLASViewer>
      <FloatingWidgetContainer>
      </FloatingWidgetContainer>
    `,
})

export class NehubaContainer implements OnInit{

      @ViewChild(NehubaBanner) nehubaBanner : NehubaBanner
      @ViewChild(NehubaUIControl) nehubaUIControl : NehubaUIControl

      ngOnInit(){
            
      }
}