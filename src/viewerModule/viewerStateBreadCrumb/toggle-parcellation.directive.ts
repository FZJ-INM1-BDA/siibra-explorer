import {Directive, ElementRef, OnDestroy, Renderer2} from "@angular/core";
import {PureContantService} from "src/util";
import {Subscription} from "rxjs";
import {
  viewerStateGetSelectedAtlas, viewerStateSelectedParcellationSelector,
  viewerStateSelectedTemplatePureSelector
} from "src/services/state/viewerState/selectors";
import {select, Store} from "@ngrx/store";

@Directive({
  selector: '[s-xplr-parc-vis-ctrl]',
  exportAs: 'toggleParcellation'
})
export class ToggleParcellationDirective implements OnDestroy {

  public visible = true
  private hiddenLayerNames = []
  private selectedAtlasId: string
  private selectedTemplateId: string

  private subscriptions: Subscription[] = []
  
  constructor(private el: ElementRef,
              private renderer: Renderer2,
              private pureService: PureContantService,
              private store$: Store<any>) {
    this.subscriptions.push(
      this.store$.select(viewerStateGetSelectedAtlas)
        .subscribe(sa => this.selectedAtlasId = sa && sa['@id']),
      this.store$.pipe(select(viewerStateSelectedTemplatePureSelector))
        .subscribe(tmpl => {this.selectedTemplateId = tmpl && tmpl['@id']}),
      this.store$.pipe(select(viewerStateSelectedParcellationSelector))
        .subscribe(tmpl => {
          this.hiddenLayerNames = []
          this.visible = true
        })
    )
  }

  public toggleParcellation = () => {
    this.pureService.getViewerConfig(this.selectedAtlasId, this.selectedTemplateId, null).then(viewerConfig => {
      if (!this.visible) {
        for (const name of this.hiddenLayerNames) {
          const l = (window as any).viewer.layerManager.getLayerByName(name)
          l && l.setVisible(true)
        }
        this.hiddenLayerNames = []
        this.visible = true

      } else {
        this.hiddenLayerNames = []
        const segLayerNames: string[] = []
        for (const layer of (window as any).viewer.layerManager.managedLayers) {
          if (layer.visible && layer.name in viewerConfig) {
            segLayerNames.push(layer.name)
          }
        }
        for (const name of segLayerNames) {
          const l = (window as any).viewer.layerManager.getLayerByName(name)
          l && l.setVisible(false)
          this.hiddenLayerNames.push( name )
        }
        this.visible = false
      }

      requestAnimationFrame(() => {
        (window as any).viewer.display.scheduleRedraw()
      })
    })

  }
  
  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe())
  }

}
