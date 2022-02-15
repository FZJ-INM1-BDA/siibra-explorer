import {Directive, ElementRef, Inject, OnDestroy, Optional, Renderer2} from "@angular/core";
import {PureContantService} from "src/util";
import {Observable, Subscription} from "rxjs";
import {
  viewerStateGetSelectedAtlas, viewerStateSelectedParcellationSelector,
  viewerStateSelectedTemplatePureSelector
} from "src/services/state/viewerState/selectors";
import {select, Store} from "@ngrx/store";
import {NehubaViewerUnit} from "src/viewerModule/nehuba";
import {NEHUBA_INSTANCE_INJTKN} from "src/viewerModule/nehuba/util";

@Directive({
  selector: '[s-xplr-parc-vis-ctrl]',
  exportAs: 'sXplrParcVisCtrl'
})
export class ParcVisCtrlDirective implements OnDestroy {

  public visible = true
  public hiddenLayerNames = []
  private selectedAtlasId: string
  private selectedTemplateId: string

  private subscriptions: Subscription[] = []

  private nehubaInst: NehubaViewerUnit

  get ngViewer() {
    return this.nehubaInst?.nehubaViewer.ngviewer
  }
  
  constructor(private pureService: PureContantService,
              private store$: Store<any>,
              @Optional() @Inject(NEHUBA_INSTANCE_INJTKN) private nehubaInst$: Observable<NehubaViewerUnit>,) {
    this.subscriptions.push(
      this.store$.pipe(select(viewerStateGetSelectedAtlas))
        .subscribe(sa => this.selectedAtlasId = sa && sa['@id']),
      this.store$.pipe(select(viewerStateSelectedTemplatePureSelector))
        .subscribe(tmpl => {this.selectedTemplateId = tmpl && tmpl['@id']}),
      this.store$.pipe(select(viewerStateSelectedParcellationSelector))
        .subscribe(() => {
          this.hiddenLayerNames = []
          this.visible = true
        }),
      this.nehubaInst$.subscribe(nehubaInst => this.nehubaInst = nehubaInst)
    )
  }

  public toggleParcellation = async () => {
    const viewerConfig = await this.pureService.getViewerConfig(this.selectedAtlasId, this.selectedTemplateId, null)

    if (!this.visible) {
      for (const name of this.hiddenLayerNames) {
        const l = this.ngViewer.layerManager.getLayerByName(name)
        l && l.setVisible(true)
      }
      this.hiddenLayerNames = []
      this.visible = true

    } else {
      this.hiddenLayerNames = []
      const segLayerNames: string[] = []
      for (const layer of this.ngViewer.layerManager.managedLayers) {
        if (layer.visible && layer.name in viewerConfig) {
          segLayerNames.push(layer.name)
        }
      }
      for (const name of segLayerNames) {
        const l = this.ngViewer.layerManager.getLayerByName(name)
        l && l.setVisible(false)
        this.hiddenLayerNames.push( name )
      }
      this.visible = false
    }

    requestAnimationFrame(() => {
      this.ngViewer.display.scheduleRedraw()
    })
    

  }
  
  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe())
  }

}
