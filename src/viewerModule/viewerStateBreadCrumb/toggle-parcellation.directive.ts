import {Directive, ElementRef, HostListener, OnDestroy, Renderer2} from "@angular/core";
import {PureContantService} from "src/util";
import {Subscription} from "rxjs";
import {
  viewerStateGetSelectedAtlas,
  viewerStateSelectedTemplatePureSelector
} from "src/services/state/viewerState/selectors";
import {select, Store} from "@ngrx/store";

@Directive({
  selector: '[toggle-parcellation]',
  exportAs: 'toggleParcellation'
})
export class ToggleParcellationDirective implements OnDestroy {

  private visible = true
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
        .subscribe(tmpl => {this.selectedTemplateId = tmpl && tmpl['@id']})
    )
  }

  @HostListener('document:keydown', ['$event.target', '$event.key']) listenQKey(target, key) {
    if (key === 'q' && target.classList.contains('neuroglancer-panel')) {
      this.toggleParcellation()
    }
  }

  @HostListener('click', ['$event'])
  mouseclick(event) {
    event.stopPropagation()
    this.toggleParcellation()
  }

  toggleParcellation() {
    this.renderer.removeClass(this.el.nativeElement, this.visible? 'fa-eye' : 'fa-eye-slash')
    this.renderer.addClass(this.el.nativeElement, this.visible? 'fa-eye-slash' : 'fa-eye')

    this.pureService.getViewerConfig(this.selectedAtlasId, this.selectedTemplateId, null).then(viewerConfig => {
      if (this.visible) {
        for (const name of this.hiddenLayerNames) {
          const l = (window as any).viewer.layerManager.getLayerByName(name)
          l && l.setVisible(true)
        }
        this.hiddenLayerNames = []

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
      }

      requestAnimationFrame(() => {
        (window as any).viewer.display.scheduleRedraw()
      })
    })

    this.visible = !this.visible
  }
  
  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe())
  }

}
