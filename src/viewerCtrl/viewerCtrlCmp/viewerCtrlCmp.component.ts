import { Component, HostBinding } from "@angular/core";
import { select, Store } from "@ngrx/store";
import { Subscription } from "rxjs";
import { viewerStateSelectedTemplatePureSelector } from "src/services/state/viewerState/selectors";


@Component({
  selector: 'viewer-ctrl-component',
  templateUrl: './viewerCtrlCmp.template.html',
  styleUrls: [
    './viewerCtrlCmp.style.css'
  ],
  exportAs: 'viewerCtrlCmp'
})

export class ViewerCtrlCmp{

  @HostBinding('attr.darktheme')
  darktheme = false

  private sub: Subscription[] = []
  private hiddenLayerNames: string[] = []

  constructor(
    private store$: Store<any>
  ){

    this.sub.push(
      this.store$.pipe(
        select(viewerStateSelectedTemplatePureSelector)
      ).subscribe(tmpl => {
        const { useTheme } = tmpl || {}
        this.darktheme = useTheme === 'dark'
      })
    )

  }

  public toggleParcVsbl(){
    const visibleParcLayers = ((window as any).viewer.layerManager.managedLayers)
      .slice(1)
      .filter(({ visible }) => visible)

    const allParcHidden = visibleParcLayers.length === 0
    
    if (allParcHidden) {
      for (const name of this.hiddenLayerNames) {
        const l = (window as any).viewer.layerManager.getLayerByName(name)
        l && l.setVisible(true)
      }
      this.hiddenLayerNames = []
    } else {
      this.hiddenLayerNames = []
      for (const { name } of visibleParcLayers) {
        const l = (window as any).viewer.layerManager.getLayerByName(name)
        l && l.setVisible(false)
        this.hiddenLayerNames.push( name )
      }
    }
    
    setTimeout(() => {
      (window as any).viewer.display.scheduleRedraw()
    })
  }
}