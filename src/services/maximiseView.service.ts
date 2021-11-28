import {Inject, Injectable, OnDestroy, Optional} from "@angular/core";
import {NehubaViewerUnit} from "src/viewerModule/nehuba";
import {getNavigationStateFromConfig, NEHUBA_INSTANCE_INJTKN} from "src/viewerModule/nehuba/util";
import {combineLatest, Observable, of, Subscription} from "rxjs";
import {viewerStateSelectedTemplatePureSelector} from "src/services/state/viewerState/selectors";
import {IavRootStoreInterface} from "src/services/stateStore.service";
import {select, Store} from "@ngrx/store";
import {debounceTime, distinctUntilChanged, filter, map, switchMap} from "rxjs/operators";
import {ngViewerActionSetPerspOctantRemoval} from "src/services/state/ngViewerState/actions";
import {ChangePerspectiveOrientationService} from "src/viewerModule/nehuba/viewerCtrl/change-perspective-orientation/changePerspectiveOrientation.service";
import {ngViewerSelectorPanelMode, ngViewerSelectorPanelOrder} from "src/services/state/ngViewerState/selectors";
import {PANELS} from "src/services/state/ngViewerState/constants";

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
    public defaultOrientation: any
    public templateTransform = []

    private panelMode$: Observable<string>
    private panelOrder: []

    public isMaximised: boolean = false

    constructor(private store$: Store<IavRootStoreInterface>,
                private poService: ChangePerspectiveOrientationService,
                @Optional() @Inject(NEHUBA_INSTANCE_INJTKN) nehubaViewer$: Observable<NehubaViewerUnit>) {
      if (nehubaViewer$) {
        this.subscriptions.push(
          nehubaViewer$.pipe(
            switchMap(viewer => {
              this.nehubaViewer = viewer
              return viewer? viewer.viewerPosInVoxel$ : of(null)
            })
          ).subscribe(
            pos => {
              this.navPosVoxel = pos
            }
          ),


          this.store$.pipe(
            select(viewerStateSelectedTemplatePureSelector),
            filter((t: any) => !!t)
          ).subscribe(t => {
            this.selectedTemplateId = t['@id']
            const navigationState = getNavigationStateFromConfig(t.nehubaConfig)
            this.defaultOrientation = navigationState.orientation
            if (this.isMaximised) {
              this.minimise()
            }
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
            this.isMaximised = true

            this.panelOrder = order

            order = order.split('').map(o => Number(o))


            this.maximise(order[0], order)

          } else {
            this.isMaximised = false
            this.minimise()
          }
        }) 
      )

    }

    maximise(panelIndex, panelOrder = '') {
      this.maximisedPanelIndex = panelIndex
      
      this.setPerspectivePanelState(panelOrder)

        
      this.defaultZoomLevels = this.nehubaViewer.config.layout.useNehubaPerspective.drawZoomLevels
      const firstLayer: any = Object.values(this.nehubaViewer.config.dataset.initialNgState.layers)[0]
      this.templateTransform = firstLayer.transform.map(t => t[3])

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
    
    minimise() {
      this.maximisedPanelIndex = null
      this.panelOrder = null
      this.store$.dispatch(
        ngViewerActionSetPerspOctantRemoval({
          octantRemovalFlag: true
        })
      )

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
  "minds/core/referencespace/v1.0.0/dafcffc5-4826-4bf1-8ff6-46b8a31ff8e2": [3500000, 2800000, 2300000],
  "minds/core/referencespace/v1.0.0/7f39f7be-445b-47c0-9791-e971c0b6d992": [3200000, 2200000, 2100000],
  "minds/core/referencespace/v1.0.0/a1655b99-82f1-420f-a3c2-fe80fd4c8588": [2100000, 2170000, 1800000] ,
  "minds/core/referencespace/v1.0.0/MEBRAINS": [3800000,3000000,1800000],
  "minds/core/referencespace/v1.0.0/265d32a0-3d84-40a5-926f-bf89f68212b9": [0,180000,140000],
  "minds/core/referencespace/v1.0.0/d5717c4a-0fa1-46e6-918c-b8003069ade8": [600000,250000,300000],
}
