import { Component,AfterViewInit } from '@angular/core'

@Component({
    selector : '#ATLASContainer',
    template : `
    
      <atlasbanner>
      </atlasbanner>

      <atlascontrol>
      </atlascontrol>
      <ATLASViewer id = "ATLASViewer">
      </ATLASViewer>
      <FloatingWidgetContainer>
      </FloatingWidgetContainer>
    `,
})

export class NehubaContainer implements AfterViewInit {
  ngAfterViewInit(){
    window.location.hash = ''
  }
}