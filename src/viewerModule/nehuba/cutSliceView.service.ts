import {
  Inject,
  Injectable,
  OnDestroy,
  OnInit,
  Optional
} from "@angular/core";
import { Store } from "@ngrx/store";
import { Observable, Subscription } from "rxjs";
import { IavRootStoreInterface } from "src/services/stateStore.service";
import {NEHUBA_INSTANCE_INJTKN} from "src/viewerModule/nehuba/util";
import {NehubaViewerUnit} from "src/viewerModule/nehuba/nehubaViewer/nehubaViewer.component";
import {ngViewerToggleCutView} from "src/services/state/ngViewerState/actions";

@Injectable()
export class CutSliceViewService implements OnDestroy, OnInit {

  public panelIndex = -1
  public cutSide = 1

  private nehubaViewer: any
  private cutActive = false
  private subscriptions: Subscription[] = []

  private defaultZoomLevels: any

  public templateTransform = []

  public navPosVoxel: any

  constructor(
    private store$: Store<IavRootStoreInterface>,
    @Optional() @Inject(NEHUBA_INSTANCE_INJTKN) nehubaViewer$: Observable<NehubaViewerUnit>
  ) {
    if (nehubaViewer$) {
      this.subscriptions.push(
        nehubaViewer$.subscribe(
          viewer => {
            this.nehubaViewer = viewer
          }
        ),
      )
    } else {
      console.warn(`NEHUBA_INSTANCE_INJTKN not injected!`)
    }
  }

  public ngOnInit() {
    this.subscriptions.push(

    )
  }

  // @HostListener('click')
  toggle(panelIndex) {
    this.panelIndex = panelIndex

    if (this.cutActive || panelIndex === -1) {
      this.clearCut()
    } else {
      this.cutViewer()
    }
    this.toggleCutView()
  }

  public toggleCutView() {
    this.store$.dispatch(ngViewerToggleCutView({
      payload: { index: this.panelIndex }
    }))
  }

  public navigate(e) {
    this.navPosVoxel[this.panelIndex === 0? 1 : this.panelIndex === 1? 0 : 2] = e.value
    this.nehubaViewer.setNavigationState({
      position : (this.navPosVoxel as [number, number, number]),
    })
  }

  cutViewer() {
    this.cutActive = true
    this.defaultZoomLevels = this.nehubaViewer.config.layout.useNehubaPerspective.drawZoomLevels
    const firstLayer: any = Object.values(this.nehubaViewer.config.dataset.initialNgState.layers)[0]
    this.templateTransform = firstLayer.transform.map(t => t[3])
    this.navPosVoxel = this.nehubaViewer.navPosVoxel

    this.nehubaViewer.config.layout.useNehubaPerspective.mesh.removeOctant = [
      this.panelIndex === 1? 1*this.cutSide : 0,
      this.panelIndex === 0? 1*this.cutSide : 0,
      this.panelIndex === 2? 1*this.cutSide : 0,
      1]
    this.nehubaViewer.config.layout.useNehubaPerspective.mesh.flipRemovedOctant = false

    this.nehubaViewer.config.layout.useNehubaPerspective.hideSlices =
      this.panelIndex === 1? ['slice1', 'slice3'] :
        this.panelIndex === 0? ['slice2', 'slice3'] :
          this.panelIndex === 2? ['slice1', 'slice2'] : []

    this.nehubaViewer.config.layout.useNehubaPerspective.drawSubstrates = {color: [0,0,0,0]}
    this.nehubaViewer.config.layout.useNehubaPerspective.drawZoomLevels = {cutOff: 0}

    this.nehubaViewer.redraw()
  }

  clearCut() {
    this.cutActive = false
    this.nehubaViewer.config.layout.useNehubaPerspective.hideSlices = []
    this.nehubaViewer.config.layout.useNehubaPerspective.mesh.flipRemovedOctant = true
    this.nehubaViewer.config.layout.useNehubaPerspective.drawSubstrates = {color: [0.0, 0.0, 1.0, 0.2]}
    this.nehubaViewer.config.layout.useNehubaPerspective.drawZoomLevels = this.defaultZoomLevels
  }

  rotate() {
    this.cutSide *= -1
    this.cutViewer()
  }


  public ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe())
  }
}
