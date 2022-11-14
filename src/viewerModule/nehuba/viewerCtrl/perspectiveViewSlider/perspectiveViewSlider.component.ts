import { Component, OnInit, OnDestroy, ChangeDetectorRef, Inject, Optional } from "@angular/core";
import { select, Store } from "@ngrx/store";
import { combineLatest, Observable, of, Subscription } from "rxjs";
import { switchMap, distinctUntilChanged, map, debounceTime, filter } from "rxjs/operators";
import { userInterface, atlasSelection } from "src/state";
import { selectedTemplate } from "src/state/atlasSelection/selectors";
import { panelMode, panelOrder } from "src/state/userInterface/selectors";
import { NehubaViewerUnit } from "../../nehubaViewer/nehubaViewer.component";
import { EnumPanelMode } from "../../store/store";
import { NEHUBA_INSTANCE_INJTKN } from "../../util";

@Component({
  selector: 'nehuba-perspective-view-slider',
  templateUrl: './perspectiveViewSlider.template.html',
  styleUrls: ['./perspectiveViewSlider.style.css']
})
  
export class PerspectiveViewSlider implements OnDestroy {

    private nehubaViewer: any
    private selectedTemplateId: string = ''
  
    private subscriptions: Subscription[] = []
  
    public maximisedPanelIndex: number | null = null
  
    public navPosVoxel: number[]
    public navPosReal: number[]
    public templateTransform: number[] = []
  
    private panelMode$: Observable<string>
    private panelOrder: string
  
    public isMaximised: boolean = false
  
    private perspectivePanel: any
  
  
    public sliderMax: number
    public sliderMin: number
    public sliderHeight: number
    public sliderTop: number
    public sliderTopForSagittal: number
  
    public previewImage: string
  
    private get viewer() { return (window as any).viewer }
    // public zoomChanged: EventEmitter<null> = new EventEmitter();

    constructor(private changeDetectionRef: ChangeDetectorRef,
        private store$: Store,
        @Optional() @Inject(NEHUBA_INSTANCE_INJTKN) nehubaViewer$: Observable<NehubaViewerUnit>) {

      if (nehubaViewer$) {
        this.subscriptions.push(
          nehubaViewer$.pipe(
            filter(viewer => !!viewer),
            switchMap(viewer => {
              this.nehubaViewer = viewer
              if (viewer){
                return combineLatest([
                  viewer.viewerPosInReal$.pipe(filter(v => !!v)),
                  viewer.viewerPosInVoxel$.pipe(filter(v => !!v))
                ])
              } else {
                of(null)
              }
            })
          ).subscribe(
            ([real, voxel]) => {
              this.navPosVoxel = voxel
              this.navPosReal = real
            }
          ),
          
          this.store$.pipe(
            select(selectedTemplate),
            filter((t: any) => !!t)
          ).subscribe(t => {
            // Minimise automatically on template chenge
            if (t && this.selectedTemplateId !== t['@id']) {
              if (this.maximisedPanelIndex !== null && this.maximisedPanelIndex >= 0) {
                this.store$.dispatch(userInterface.actions.toggleMaximiseView({
                  targetIndex: this.maximisedPanelIndex
                }))
              }
              this.cleanOnMinimise()
            }
          
            this.selectedTemplateId = t['@id']
          }),
          
          this.store$.pipe(
            select(atlasSelection.selectors.navigation),
            filter((n: any) => !!n && n.position && n.zoom)
          ).subscribe(nav => {
            if (this.isMaximised && this.panelOrder && +this.panelOrder[0] !== 3) {
              const panel = document.getElementsByClassName('neuroglancer-panel')
          
              if ( panel && panel.length) {
                const fP: any = panel[0]
                const height = fP.offsetHeight
                const width = fP.offsetWidth
                const divisor = 1e6
                const viewSize = 200
                const calcOri : 'height' | 'width' = +this.panelOrder[0] === 2? 'width' : 'height'
                const position = calcOri === 'height'? nav.position[2] : nav.position[0]
                const hiSize = calcOri === 'height'? height : width
                const max = (position + (hiSize/2 * nav.zoom)) / divisor
                const min = (position - (hiSize/2 * nav.zoom)) / divisor
                const perMax = 100 * (nav.perspectiveZoom/2) / divisor
                const perMin = -100 * (nav.perspectiveZoom/2) / divisor
                const radiusOnPer = (max*divisor - position)/nav.perspectiveZoom
                const lineHeight = 4*radiusOnPer
                const top = (perMax-max)*viewSize/(perMax-perMin)
                const topForSagittal = (viewSize-lineHeight)/2
                        
                this.sliderMax=max
                this.sliderMin=min
                this.sliderHeight = lineHeight
                this.sliderTop = top
                this.sliderTopForSagittal = topForSagittal
                        
                this.changeDetectionRef.detectChanges()
              }
            }
          
          })
          
        )
      } else {
        console.warn(`NEHUBA_INSTANCE_INJTKN not injected!`)
      }
          
          
      this.panelMode$ = this.store$.pipe(
        select(panelMode),
        distinctUntilChanged(),
      ),
          
      this.subscriptions.push(
        combineLatest([
          this.panelMode$.pipe(
            map(panelMode => panelMode === EnumPanelMode.PIP_PANEL),
            distinctUntilChanged(),
          ),
          this.store$.pipe(
            select(panelOrder),
            distinctUntilChanged(),
            debounceTime(300)
          )
        ]).subscribe(([singlePanel, orderStr]) => {
          if (singlePanel && this.panelOrder !== orderStr) {

            console.log('panelChanged')
          
            const firstExpand = !this.panelOrder
            this.panelOrder = orderStr
          
            const order = orderStr.split('').map(o => Number(o))
          
            if (order[0] === 3) {
              this.toggleScaleBar(true)
            } else {
              this.maximise(order[0], order)
            }

            this.detectChanges()
          
          } else {
            this.isMaximised = false
            this.cleanOnMinimise()
          }
        })
      )
    }

    maximise(panelIndex: number, panelOrder: number[]) {
      this.previewImage = `assets/images/persp-view/${perspectiveScreenshots[this.selectedTemplateId][+panelOrder[0]]}`

      this.isMaximised = true
      this.maximisedPanelIndex = panelIndex
      this.toggleScaleBar()

      const { transform } = Object.values(this.nehubaViewer.config.dataset.initialNgState.layers)[0] as { transform }
      this.templateTransform = transform.map(t => t[3])
    }

    toggleScaleBar(clear = false) {
      if (this.viewer) {
        this.perspectivePanel = Array.from(this.viewer.display.panels).find((p: any) => p.viewer?.orthographicProjection)
        if (this.perspectivePanel) {
          if (this.perspectivePanel.viewer && (this.perspectivePanel.viewer.showScaleBar.value && !clear)
                    || !this.perspectivePanel.viewer.showScaleBar.value && clear) {
            this.perspectivePanel.viewer.showScaleBar.toggle()
          }
        }
      }
    }

    cleanOnMinimise() {
      this.maximisedPanelIndex = null
      this.panelOrder = null
      this.toggleScaleBar(true)
    }

    public navigate(value: number) {
      this.navPosVoxel[this.maximisedPanelIndex === 0 ? 1 : this.maximisedPanelIndex === 1 ? 0 : 2] =
            this.maximisedPanelIndex === 1 ? -value : value
      this.nehubaViewer.setNavigationState({
        position: (this.navPosVoxel as [number, number, number]),
      })
    }

    detectChanges(): void {
      this.changeDetectionRef.detectChanges()
    }

    ngOnDestroy(): void {
      this.subscriptions.forEach(s => s.unsubscribe());
    }
  
}

const perspectiveScreenshots = {
  "minds/core/referencespace/v1.0.0/dafcffc5-4826-4bf1-8ff6-46b8a31ff8e2": ['mni1.png', 'mni2.png', 'mni3.png'],
  "minds/core/referencespace/v1.0.0/7f39f7be-445b-47c0-9791-e971c0b6d992": ['colin1.png', 'colin2.png', 'colin3.png'],
  "minds/core/referencespace/v1.0.0/a1655b99-82f1-420f-a3c2-fe80fd4c8588": ['bb1.png', 'bb2.png', 'bb3.png'],
  "minds/core/referencespace/v1.0.0/MEBRAINS": ['monkey1.png', 'monkey2.png', 'monkey3.png'],
  "minds/core/referencespace/v1.0.0/265d32a0-3d84-40a5-926f-bf89f68212b9": ['mouse1.png', 'mouse2.png', 'mouse3.png'],
  "minds/core/referencespace/v1.0.0/d5717c4a-0fa1-46e6-918c-b8003069ade8": ['rat1.png', 'rat2.png', 'rat3.png'],
}