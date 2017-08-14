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
      <ATLASViewer (click)="temporaryDebounce($event)" (showModal)="showModal($event)" [darktheme]="nehubaUIControl.darktheme" id = "ATLASViewer">
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

      showModal(ev:any){
        switch (ev){
          case 'showHelpModal':{
            this.nehubaUIControl.modal.showModal('Basic Controls',this.helpMenu)
          }break;
        }
      }

      helpMenu:any = 
        {
          'Mouse Controls' : {
            "Left-drag" : "within a slice view to move within that plane",
            "Shift + Left-drag" : "within a slice view to change the rotation of the slice views",
            "Mouse-Wheel" : "up or down to zoom in and out.",
            "Ctrl + Mouse-Wheel" : "moves the navigation forward and backward",
            "Ctrl + Right-click" : "within a slice to teleport to that location"
          },
          'Keyboard Controls' : {
            "tobe":"completed"
          }
        }
      
}