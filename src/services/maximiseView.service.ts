import {Inject, Injectable, OnDestroy, Optional} from "@angular/core";
import {NehubaViewerUnit} from "src/viewerModule/nehuba";
import {getNavigationStateFromConfig, NEHUBA_INSTANCE_INJTKN} from "src/viewerModule/nehuba/util";
import {combineLatest, Observable, of, Subscription} from "rxjs";
import {viewerStateSelectedTemplatePureSelector} from "src/services/state/viewerState/selectors";
import {IavRootStoreInterface} from "src/services/stateStore.service";
import {select, Store} from "@ngrx/store";
import {debounceTime, distinctUntilChanged, filter, map, mergeMap} from "rxjs/operators";
import {ngViewerActionSetPerspOctantRemoval, ngViewerActionToggleMax} from "src/services/state/ngViewerState/actions";
import {ChangePerspectiveOrientationService} from "src/viewerModule/nehuba/viewerCtrl/change-perspective-orientation/changePerspectiveOrientation.service";
import {ngViewerSelectorPanelMode, ngViewerSelectorPanelOrder} from "src/services/state/ngViewerState/selectors";
import {PANELS} from "src/services/state/ngViewerState/constants";
import {VIEWER_INJECTION_TOKEN} from "src/ui/layerbrowser/layerDetail/layerDetail.component";

@Injectable({
  providedIn: 'root'
})
export class MaximiseViewService implements OnDestroy {

    private nehubaViewer: any
    private selectedTemplateId: string = ''

    private subscriptions: Subscription[] = []

    public maximisedPanelIndex: number | null = null
    
    public defaultZoomLevels

    public navPosVoxel: any
    public navPosReal: any
    public defaultOrientation: any
    public templateTransform = []

    private panelMode$: Observable<string>
    private panelOrder: any

    public isMaximised: boolean = false

    private perspectivePanel: any

    private get viewer(){
      return this.injectedViewer || (window as any).viewer
    }

    constructor(private store$: Store<IavRootStoreInterface>,
                private poService: ChangePerspectiveOrientationService,
                @Optional() @Inject(NEHUBA_INSTANCE_INJTKN) nehubaViewer$: Observable<NehubaViewerUnit>,
                @Optional() @Inject(VIEWER_INJECTION_TOKEN) private injectedViewer) {

      if (nehubaViewer$) {
        this.subscriptions.push(
          nehubaViewer$.pipe(
            filter(viewer => !!viewer),
            mergeMap(viewer => {
              this.nehubaViewer = viewer
              if (viewer){
                return combineLatest([
                  viewer.viewerPosInReal$.pipe(filter(v => !!v)), 
                  viewer.viewerPosInVoxel$.pipe(filter(v => !!v))
                ])
              } else {
                of([null, null])
              }
            })
          ).subscribe(
            ([real, voxel]) => {
              this.navPosVoxel = voxel
              this.navPosReal = real
            }
          ),

          this.store$.pipe(
            select(viewerStateSelectedTemplatePureSelector),
            filter((t: any) => !!t)
          ).subscribe(t => {
            // Minimise automatically on template chenge
            if (t && this.selectedTemplateId !== t['@id']) {
              if (this.maximisedPanelIndex !== null && this.maximisedPanelIndex >= 0) {
                this.store$.dispatch(ngViewerActionToggleMax({
                  payload: { index: this.maximisedPanelIndex }
                }))
              }
              this.cleanOnMinimise()
            }

            this.selectedTemplateId = t['@id']
            const navigationState = getNavigationStateFromConfig(t.nehubaConfig)
            this.defaultOrientation = navigationState.orientation
          }),
        )
      } else {
        console.warn(`NEHUBA_INSTANCE_INJTKN not injected!`)
      }


      this.panelMode$ = this.store$.pipe(
        select(ngViewerSelectorPanelMode),
        distinctUntilChanged(),
      ),

      this.subscriptions.push(
        combineLatest([
          this.panelMode$.pipe(
            map(panelMode => panelMode === PANELS.SINGLE_PANEL),
            distinctUntilChanged(),
          ),
          this.store$.pipe(
            select(ngViewerSelectorPanelOrder),
            distinctUntilChanged(),
            debounceTime(500)
          )
        ]).subscribe(([singlePanel, order]) => {
          if (singlePanel && this.panelOrder !== order) {

            const firstExpand = !this.panelOrder
            this.panelOrder = order


            order = order.split('').map(o => Number(o))

            if (order[0] === 3) {
              this.formatMiniPerspectiveView(true)
            } else {
              this.maximise(order[0], order)
              //  ToDo find better solution
              if (firstExpand) {
                setTimeout(() => this.fakeRedraw(), 500)
              } else {
                this.fakeRedraw()
              }
            }

          } else {
            this.isMaximised = false
            this.cleanOnMinimise()
          }
        }) 
      )

    }

    maximise(panelIndex, panelOrder = '') {
      this.maximisedPanelIndex = panelIndex
      this.formatMiniPerspectiveView()
      this.setPerspectivePanelState(panelOrder)

        
      this.defaultZoomLevels = this.nehubaViewer.config.layout.useNehubaPerspective.drawZoomLevels
      const firstLayer: any = Object.values(this.nehubaViewer.config.dataset.initialNgState.layers)[0]
      this.templateTransform = firstLayer.transform.map(t => t[3])

    }

    formatMiniPerspectiveView(clear = false) {
      this.store$.dispatch(
        ngViewerActionSetPerspOctantRemoval({
          octantRemovalFlag: clear
        })
      )
      if (this.viewer) {
        this.perspectivePanel = Array.from(this.viewer.display.panels).find((p: any) => p.viewer?.orthographicProjection)
        this.perspectivePanel.viewer.orthographicProjection.value = !clear

        // Toggle scale bar
        if ((this.perspectivePanel.viewer.showScaleBar.value && !clear)
            || !this.perspectivePanel.viewer.showScaleBar.value && clear) {
          this.perspectivePanel.viewer.showScaleBar.toggle()
        }

      }
    }

    setPerspectivePanelState(panelOrder) {
      if (panelOrder[0] === 0) {
        this.poService.set3DViewPoint('sagittal', 'first',
          defaultZoom[this.selectedTemplateId][this.maximisedPanelIndex])
      } else if (panelOrder[0] === 1) {
        this.poService.set3DViewPoint('coronal', 'first',
          defaultZoom[this.selectedTemplateId][this.maximisedPanelIndex])
      } else if (panelOrder[0] === 2) {
        this.poService.set3DViewPoint('coronal', 'first',
          defaultZoom[this.selectedTemplateId][this.maximisedPanelIndex])
      }
    }

    //  ToDo find better solution
    fakeRedraw() {

      if (this.perspectivePanel) {
        setTimeout(() => {
          this.perspectivePanel.draw()
        })
      }

      if (this.panelOrder && +this.panelOrder[0] !== 3) {
        setTimeout(() => {
          const fakeRedrawIndex = +this.panelOrder[1] !== 3 ? +this.panelOrder[1] : +this.panelOrder[2]
          const a: any = Array.from(this.viewer.display.panels)[fakeRedrawIndex]
          a.draw()
        })
      }

    }
    
    cleanOnMinimise() {
      this.maximisedPanelIndex = null
      this.panelOrder = null
      this.formatMiniPerspectiveView(true)
    }

    public navigate(value) {
      this.navPosVoxel[this.maximisedPanelIndex === 0? 1 : this.maximisedPanelIndex === 1? 0 : 2] =
            this.maximisedPanelIndex === 1? -value : value
      this.nehubaViewer.setNavigationState({
        position : (this.navPosVoxel as [number, number, number]),
      })
    }

    
    public ngOnDestroy() {
      this.subscriptions.forEach(s => s.unsubscribe())
    }
}

const defaultZoom = {
  "minds/core/referencespace/v1.0.0/dafcffc5-4826-4bf1-8ff6-46b8a31ff8e2": [3300000, 2350000, 1950000],
  "minds/core/referencespace/v1.0.0/7f39f7be-445b-47c0-9791-e971c0b6d992": [2700000, 1850000, 1650000],
  "minds/core/referencespace/v1.0.0/a1655b99-82f1-420f-a3c2-fe80fd4c8588": [1700000, 1750000, 1450000] ,
  "minds/core/referencespace/v1.0.0/MEBRAINS": [3450000,2700000,1300000],
  "minds/core/referencespace/v1.0.0/265d32a0-3d84-40a5-926f-bf89f68212b9": [165000,140000,100000],
  "minds/core/referencespace/v1.0.0/d5717c4a-0fa1-46e6-918c-b8003069ade8": [600000,240000,240000],
}
