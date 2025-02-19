import { AfterViewInit, Component, EventEmitter, OnDestroy, Output, ViewChild } from "@angular/core";
import { concat, of, Subscription } from "rxjs";
import { withLatestFrom } from "rxjs/operators";
import { EnumViewerEvt, TViewerEvent } from "../../viewer.interface";
import { NehubaLayerControlService } from "../layerCtrl.service";
import { NehubaViewerContainerDirective } from "./nehubaViewerInterface.directive";
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
        of('start' as const),
        mouseOverSegments
      ).pipe(
        withLatestFrom(
          this.layerCtrlService.completeNgIdLabelRegionMap$
        )
      ).subscribe(([seg, multiNgIdsRegionsLabelIndexMap]) => {
        const isStart = seg === "start"
        this.viewerEvent.emit({
          type: EnumViewerEvt.VIEWER_CTX,
          data: {
            viewerType: 'nehuba',
            payload: {
              nehuba: isStart
              ? []
              : seg.map(v => {
                return {
                  layerName: v.layer.name,
                  labelIndices: [ Number(v.segmentId) ],
                  regions: (() => {
                    const record = multiNgIdsRegionsLabelIndexMap[v.layer.name] || {}
                    const region = record[Number(v.segmentId)]
                    if (!record || !region) return []
                    return [region]
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


  private subscriptions: Subscription[] = []
}
