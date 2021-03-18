import { Component, HostBinding, Inject, Optional } from "@angular/core";
import { select, Store } from "@ngrx/store";
import { combineLatest, Observable, Subscription } from "rxjs";
import { filter, map } from "rxjs/operators";
import { ngViewerActionSetPerspOctantRemoval } from "src/services/state/ngViewerState/actions";
import { ngViewerSelectorOctantRemoval } from "src/services/state/ngViewerState/selectors";
import { viewerStateCustomLandmarkSelector, viewerStateSelectedTemplatePureSelector } from "src/services/state/viewerState/selectors";
import { NehubaViewerUnit } from "src/viewerModule/nehuba";
import { NEHUBA_INSTANCE_INJTKN } from "src/viewerModule/nehuba/util";
import { ARIA_LABELS, IDS } from 'common/constants'

@Component({
  selector: 'viewer-ctrl-component',
  templateUrl: './viewerCtrlCmp.template.html',
  styleUrls: [
    './viewerCtrlCmp.style.css'
  ],
  exportAs: 'viewerCtrlCmp'
})

export class ViewerCtrlCmp{

  public ARIA_LABELS = ARIA_LABELS

  @HostBinding('attr.darktheme')
  darktheme = false

  private _flagDelin = true
  get flagDelin(){
    return this._flagDelin
  }
  set flagDelin(flag){
    this._flagDelin = flag
    this.toggleParcVsbl()
  }

  private sub: Subscription[] = []
  private hiddenLayerNames: string[] = []

  private _removeOctantFlag: boolean
  get removeOctantFlag(){
    return this._removeOctantFlag
  }
  set removeOctantFlag(val){
    this._removeOctantFlag = val
    this.setOctantRemoval(this._removeOctantFlag)
  }

  public nehubaViewerPerspectiveOctantRemoval$ = this.store$.pipe(
    select(ngViewerSelectorOctantRemoval),
  )

  public customLandmarks$: Observable<any> = this.store$.pipe(
    select(viewerStateCustomLandmarkSelector),
    map(lms => lms.map(lm => ({
      ...lm,
      geometry: {
        position: lm.position
      }
    }))),
  )

  constructor(
    private store$: Store<any>,
    @Optional() @Inject(NEHUBA_INSTANCE_INJTKN) private nehubaInst$: Observable<NehubaViewerUnit>,
  ){

    this.sub.push(
      this.store$.pipe(
        select(viewerStateSelectedTemplatePureSelector)
      ).subscribe(tmpl => {
        const { useTheme } = tmpl || {}
        this.darktheme = useTheme === 'dark'
      }),

      this.nehubaViewerPerspectiveOctantRemoval$.subscribe(
        flag => this.removeOctantFlag = flag
      ),

      combineLatest([
        this.customLandmarks$,
        this.nehubaInst$,
      ]).pipe(
        filter(([_, neubaInst]) => !!neubaInst),
      ).subscribe(([landmarks, nehubainst]) => {
        this.setOctantRemoval(landmarks.length === 0)
        nehubainst.updateUserLandmarks(landmarks)
      })
    )
  }

  public toggleParcVsbl(){
    const visibleParcLayers = ((window as any).viewer.layerManager.managedLayers)
      .slice(1)
      .filter(({ visible }) => visible)

    if (this.flagDelin) {
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

  public setOctantRemoval(octantRemovalFlag: boolean) {
    this.store$.dispatch(
      ngViewerActionSetPerspOctantRemoval({
        octantRemovalFlag
      })
    )
  }
}
