import {Inject, Injectable, OnDestroy, Optional} from "@angular/core";
import {NehubaViewerUnit} from "src/viewerModule/nehuba";
import {getNavigationStateFromConfig, NEHUBA_INSTANCE_INJTKN} from "src/viewerModule/nehuba/util";
import {combineLatest, Observable, of, Subscription} from "rxjs";
import {
  viewerStateNavigationStateSelector,
  viewerStateSelectedTemplatePureSelector
} from "src/services/state/viewerState/selectors";
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
    
    public max: any
    public min: any
    public height: any
    public top: any

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

          this.store$.pipe(
            select(viewerStateNavigationStateSelector),
            filter(n => !!n && n.position && n.zoom)
          ).subscribe(nav => {
            if (this.isMaximised && this.panelOrder && +this.panelOrder[0] !== 3) {
              const panel = document.getElementsByClassName('neuroglancer-panel')

              if ( panel && panel.length) {
                const fP: any = panel[0]
                const height = fP.offsetHeight
                const width = fP.offsetWidth

                const divisor = 1e6
                const calcOri : 'height' | 'width' = +this.panelOrder[0] === 2? 'width' : 'height'
                const position = calcOri === 'height'? nav.position[2] : nav.position[0]
                const hiSize = calcOri === 'height'? height : width

                const min = (position - (hiSize * nav.zoom)) / divisor
                const max = (position + (hiSize * nav.zoom)) / divisor

                const perstMin = -(200 * nav.perspectiveZoom) / divisor
                const perstMax = 200 * nav.perspectiveZoom / divisor

                this.min=min
                this.max=max
                this.height=(max - min) * 200 / hiSize
                this.top = (perstMax-max)*200/(perstMax-perstMin)

              }
            }
              
          })
            
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
      this.isMaximised = true
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
    // Order of redrawing is an issue
    fakeRedraw() {
      if (this.perspectivePanel) {
        this.perspectivePanel.setGLViewport();
        this.perspectivePanel.draw()
      }
      if (this.panelOrder && +this.panelOrder[0] !== 3) {
        const fakeRedrawIndex = +this.panelOrder[1] !== 3 ? +this.panelOrder[1] : +this.panelOrder[2]
        const a: any = Array.from(this.viewer.display.panels)[fakeRedrawIndex]
        a.setGLViewport()
        a.draw()
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
