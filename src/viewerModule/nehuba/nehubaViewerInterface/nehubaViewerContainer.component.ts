import { AfterViewInit, Component, EventEmitter, OnDestroy, Output, ViewChild } from "@angular/core";
import { concat, Observable, of, Subscription } from "rxjs";
import { map, withLatestFrom } from "rxjs/operators";
import { SapiRegionModel } from "src/atlasComponents/sapi";
import { EnumViewerEvt, TViewerEvent } from "../../viewer.interface";
import { NehubaLayerControlService } from "../layerCtrl.service";
import { NehubaViewerContainerDirective } from "./nehubaViewerInterface.directive";
import { getParcNgId, getRegionLabelIndex } from "../config.service";
import { Store } from "@ngrx/store";
import { atlasSelection } from "src/state";

@Component({
  selector: `sxplr-nehuba-viewer-container`,
  templateUrl: `./nehubaViewerContainer.template.html`,
  styleUrls: [`./nehubaViewerContainer.style.css`]
})

export class NehubaViewerContainer implements AfterViewInit, OnDestroy {

  handleViewerLoadedEvent(flag: boolean) {
    this.viewerEvent.emit({
      type: EnumViewerEvt.VIEWERLOADED,
      data: flag
    })
  }

  @Output()
  viewerEvent = new EventEmitter<TViewerEvent<'nehuba'>>()

  ngAfterViewInit(): void {
    if (!this.nehubaContainerDirective) {
      console.warn('cannot setup nehubaContainerDirective hooks')
      return
    }

    const {
      mouseOverSegments,
      navigationEmitter,
      mousePosEmitter,
    } = this.nehubaContainerDirective

    this.subscriptions.push(
      this.store.pipe(
        atlasSelection.fromRootStore.distinctATP()
      ).subscribe(() => {
        this.nehubaContainerDirective.clear()
      }),

      concat(
        of(null),
        mouseOverSegments
      ).pipe(
        withLatestFrom(
          this.multiNgIdsRegionsLabelMap$
        )
      ).subscribe(([seg, multiNgIdsRegionsLabelIndexMap]) => {
        this.viewerEvent.emit({
          type: EnumViewerEvt.VIEWER_CTX,
          data: {
            viewerType: 'nehuba',
            payload: {
              nehuba: seg && seg.map(v => {
                return {
                  layerName: v.layer.name,
                  labelIndices: [ Number(v.segmentId) ],
                  regions: (() => {
                    const map = multiNgIdsRegionsLabelIndexMap.get(v.layer.name)
                    if (!map) return []
                    return [map.get(Number(v.segmentId))]
                  })()
                }
              })
            }
          }
        })
      }),

      concat(
        of(null),
        navigationEmitter,
      ).subscribe(nav => {
        this.viewerEvent.emit({
          type: EnumViewerEvt.VIEWER_CTX,
          data: {
            viewerType: 'nehuba',
            payload: {
              nav
            }
          }
        })
      }),

      concat(
        of(null),
        mousePosEmitter,
      ).subscribe(mouse => {
        this.viewerEvent.emit({
          type: EnumViewerEvt.VIEWER_CTX,
          data: {
            viewerType: 'nehuba',
            payload: {
              mouse
            }
          }
        })
      })
    )

  }

  ngOnDestroy(): void {
    while (this.subscriptions.length) this.subscriptions.pop().unsubscribe()
  }

  constructor(private store: Store, private layerCtrlService: NehubaLayerControlService) {}

  @ViewChild(NehubaViewerContainerDirective, { static: true })
  private nehubaContainerDirective: NehubaViewerContainerDirective

  private multiNgIdsRegionsLabelMap$: Observable<Map<string, Map<number, SapiRegionModel>>> = this.layerCtrlService.selectedATPR$.pipe(
    map(( { atlas, parcellation, template, regions } ) => {
      
      const retMap = new Map<string, Map<number, SapiRegionModel>>()
      for (const r of regions) {
        const ngId = getParcNgId(atlas, template, parcellation, r)
        if (!ngId) continue
        if (!retMap.has(ngId)) {
          retMap.set(ngId, new Map())
        }
        const labelIndex = getRegionLabelIndex(atlas, template, parcellation, r)
        if (!labelIndex) continue
        retMap.get(ngId).set(labelIndex, r)
      }
      return retMap
    })
  )

  private subscriptions: Subscription[] = []
}
