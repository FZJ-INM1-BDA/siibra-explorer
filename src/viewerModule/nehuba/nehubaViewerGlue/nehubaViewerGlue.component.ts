import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Inject, OnDestroy, Optional, Output, TemplateRef, ViewChild } from "@angular/core";
import { select, Store } from "@ngrx/store";
import { Subject, Subscription } from "rxjs";
import { ClickInterceptor, CLICK_INTERCEPTOR_INJECTOR } from "src/util";
import { distinctUntilChanged, startWith } from "rxjs/operators";
import { ARIA_LABELS } from 'common/constants'
import { LoggingService } from "src/logging";
import { EnumViewerEvt, IViewer, TViewerEvent } from "../../viewer.interface";
import { NehubaViewerContainerDirective, TMouseoverEvent } from "../nehubaViewerInterface/nehubaViewerInterface.directive";
import { API_SERVICE_SET_VIEWER_HANDLE_TOKEN, TSetViewerHandle } from "src/atlasViewer/atlasViewer.apiService.service";
import { NehubaMeshService } from "../mesh.service";
import { NehubaLayerControlService, SET_COLORMAP_OBS, SET_LAYER_VISIBILITY } from "../layerCtrl.service";
import { getExportNehuba, getUuid } from "src/util/fn";
import { INavObj } from "../navigation.service";
import { NG_LAYER_CONTROL, SET_SEGMENT_VISIBILITY } from "../layerCtrl.service/layerCtrl.util";
import { MatSnackBar } from "@angular/material/snack-bar";
import { getShader } from "src/util/constants";
import { EnumColorMapName } from "src/util/colorMaps";
import { MatDialog } from "@angular/material/dialog";
import { AtlasWorkerService } from "src/atlasViewer/atlasViewer.workerService.service";
import { SapiRegionModel } from "src/atlasComponents/sapi";
import { NehubaConfig, getParcNgId, getRegionLabelIndex } from "../config.service";
import { SET_MESHES_TO_LOAD } from "../constants";
import { annotation, atlasAppearance, atlasSelection, userInteraction } from "src/state";

export const INVALID_FILE_INPUT = `Exactly one (1) nifti file is required!`

@Component({
  selector: 'iav-cmp-viewer-nehuba-glue',
  templateUrl: './nehubaViewerGlue.template.html',
  styleUrls: [
    './nehubaViewerGlue.style.css'
  ],
  exportAs: 'iavCmpViewerNehubaGlue',
  providers: [
    {
      provide: SET_MESHES_TO_LOAD,
      useFactory: (meshService: NehubaMeshService) => meshService.loadMeshes$,
      deps: [ NehubaMeshService ]
    },
    NehubaMeshService,
    {
      provide: SET_COLORMAP_OBS,
      useFactory: (layerCtrl: NehubaLayerControlService) => layerCtrl.setColorMap$,
      deps: [ NehubaLayerControlService ]
    },
    {
      provide: SET_LAYER_VISIBILITY,
      useFactory: (layerCtrl: NehubaLayerControlService) => layerCtrl.visibleLayer$,
      deps: [ NehubaLayerControlService ]
    },
    {
      provide: SET_SEGMENT_VISIBILITY,
      useFactory: (layerCtrl: NehubaLayerControlService) => layerCtrl.segmentVis$,
      deps: [ NehubaLayerControlService ]
    },
    {
      provide: NG_LAYER_CONTROL,
      useFactory: (layerCtrl: NehubaLayerControlService) => layerCtrl.ngLayersController$,
      deps: [ NehubaLayerControlService ]
    },
    NehubaLayerControlService,
    NehubaMeshService,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class NehubaGlueCmp implements IViewer<'nehuba'>, OnDestroy, AfterViewInit {

  @ViewChild('layerCtrlTmpl', { read: TemplateRef }) layerCtrlTmpl: TemplateRef<any>

  public ARIA_LABELS = ARIA_LABELS

  @ViewChild(NehubaViewerContainerDirective, { static: true })
  public nehubaContainerDirective: NehubaViewerContainerDirective

  private onhoverSegments: SapiRegionModel[] = []
  private onDestroyCb: (() => void)[] = []
  private multiNgIdsRegionsLabelIndexMap = new Map<string, Map<number, SapiRegionModel>>()

  public nehubaConfig: NehubaConfig

  public customLandmarks$ = this.store$.pipe(
    select(annotation.selectors.annotations),
  )

  public filterCustomLandmark(lm: any){
    return !!lm['showInSliceView']
  }

  private nehubaContainerSub: Subscription[] = []
  private setupNehubaEvRelay() {
    while (this.nehubaContainerSub.length > 0) this.nehubaContainerSub.pop().unsubscribe()
    
    if (!this.nehubaContainerDirective) return
    const {
      mouseOverSegments,
      navigationEmitter,
      mousePosEmitter,
    } = this.nehubaContainerDirective

    this.nehubaContainerSub.push(

      mouseOverSegments.pipe(
        startWith(null as TMouseoverEvent[])
      ).subscribe(seg => {
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
                    const map = this.multiNgIdsRegionsLabelIndexMap.get(v.layer.name)
                    if (!map) return []
                    return [map.get(Number(v.segmentId))]
                  })()
                }
              })
            }
          }
        })
      }),

      navigationEmitter.pipe(
        startWith(null as INavObj)
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

      mousePosEmitter.pipe(
        startWith(null as {
          voxel: number[]
          real: number[]
        })
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

    this.onDestroyCb.push(
      () => {
        if (this.nehubaContainerSub) {
          while(this.nehubaContainerSub.length > 0) this.nehubaContainerSub.pop().unsubscribe()
        }
      }
    )
  }

  ngAfterViewInit(){
    this.setupNehubaEvRelay()
  }

  ngOnDestroy() {
    while (this.onDestroyCb.length) this.onDestroyCb.pop()()
  }


  private disposeViewer() {
    /**
     * clear existing container
     */
    this.nehubaContainerDirective && this.nehubaContainerDirective.clear()
  }

  @Output()
  public viewerEvent = new EventEmitter<TViewerEvent<'nehuba'>>()

  constructor(
    private store$: Store<any>,
    private snackbar: MatSnackBar,
    private dialog: MatDialog,
    private worker: AtlasWorkerService,
    private layerCtrlService: NehubaLayerControlService,
    @Optional() @Inject(CLICK_INTERCEPTOR_INJECTOR) clickInterceptor: ClickInterceptor,
    @Optional() @Inject(API_SERVICE_SET_VIEWER_HANDLE_TOKEN) setViewerHandle: TSetViewerHandle,
  ){
    /**
     * This **massively** improve the performance of the viewer
     * TODO investigate why, and perhaps eventually remove the cdr.detach()
     */
    // this.cdr.detach()

    /**
     * define onclick behaviour
     */
    if (clickInterceptor) {
      const { deregister, register } = clickInterceptor
      const selOnhoverRegion = this.selectHoveredRegion.bind(this)
      register(selOnhoverRegion, { last: true })
      this.onDestroyCb.push(() => deregister(selOnhoverRegion))
    }

    const onATPClear = this.store$.pipe(
      atlasSelection.fromRootStore.distinctATP()
    ).subscribe(this.disposeViewer.bind(this))
    this.onDestroyCb.push(() => onATPClear.unsubscribe())
    
    /**
     * subscribe to ngIdtolblIdxToRegion
     */
    const ngIdSub = this.layerCtrlService.selectedATPR$.subscribe(({ atlas, parcellation, template, regions }) => {
      this.multiNgIdsRegionsLabelIndexMap.clear()
      for (const r of regions) {
        const ngId = getParcNgId(atlas, template, parcellation, r)
        const labelIndex = getRegionLabelIndex(atlas, template, parcellation, r)
        if (!this.multiNgIdsRegionsLabelIndexMap.has(ngId)) {
          this.multiNgIdsRegionsLabelIndexMap.set(ngId, new Map())
        }
        this.multiNgIdsRegionsLabelIndexMap.get(ngId).set(labelIndex, r)
      }
    })
    this.onDestroyCb.push(() => ngIdSub.unsubscribe())

    /**
     * on hover segment
     */
    const onhovSegSub = this.store$.pipe(
      select(userInteraction.selectors.mousingOverRegions),
      distinctUntilChanged(),
    ).subscribe(arr => {
      this.onhoverSegments = arr
    })
    this.onDestroyCb.push(() => onhovSegSub.unsubscribe())

    if (setViewerHandle) {
      console.warn(`NYI viewer handle is deprecated`)
    }
  }


  handleViewerLoadedEvent(flag: boolean) {
    this.viewerEvent.emit({
      type: EnumViewerEvt.VIEWERLOADED,
      data: flag
    })
  }

  private selectHoveredRegion(_ev: any): boolean{
    /**
     * If label indicies are not defined by the ontology, it will be a string in the format of `{ngId}#{labelIndex}`
     */
    const trueOnhoverSegments = this.onhoverSegments && this.onhoverSegments.filter(v => typeof v === 'object')
    if (!trueOnhoverSegments || (trueOnhoverSegments.length === 0)) return true
    this.store$.dispatch(
      atlasSelection.actions.selectRegion({
        region: trueOnhoverSegments[0]
      })
    )
    return true
  }

  private droppedLayerNames: {
    layerName: string
    resourceUrl: string
  }[] = []
  private dismissAllAddedLayers(){
    while (this.droppedLayerNames.length) {
      const { resourceUrl, layerName } = this.droppedLayerNames.pop()
      this.store$.dispatch(
        atlasAppearance.actions.removeCustomLayer({
          id: layerName
        })
      )
      
      URL.revokeObjectURL(resourceUrl)
    }
  }
  public async handleFileDrop(files: File[]){
    if (files.length !== 1) {
      this.snackbar.open(INVALID_FILE_INPUT, 'Dismiss', {
        duration: 5000
      })
      return
    }
    const randomUuid = getUuid()
    const file = files[0]

    /**
     * TODO check extension?
     */
     
    this.dismissAllAddedLayers()
    
    // Get file, try to inflate, if files, use original array buffer
    const buf = await file.arrayBuffer()
    let outbuf
    try {
      outbuf = getExportNehuba().pako.inflate(buf).buffer
    } catch (e) {
      console.log('unpack error', e)
      outbuf = buf
    }

    try {
      const { result, ...other } = await this.worker.sendMessage({
        method: 'PROCESS_NIFTI',
        param: {
          nifti: outbuf
        },
        transfers: [ outbuf ]
      })
      
      const { meta, buffer } = result

      const url = URL.createObjectURL(new Blob([ buffer ]))
      this.droppedLayerNames.push({
        layerName: randomUuid,
        resourceUrl: url
      })

      this.store$.dispatch(
        atlasAppearance.actions.addCustomLayer({
          customLayer: {
            id: randomUuid,
            source: `nifti://${url}`,
            shader: getShader({
              colormap: EnumColorMapName.MAGMA,
              lowThreshold: meta.min || 0,
              highThreshold: meta.max || 1
            }),
            clType: 'customlayer/nglayer'
          }
        })
      )
      this.dialog.open(
        this.layerCtrlTmpl,
        {
          data: {
            layerName: randomUuid,
            filename: file.name,
            moreInfoFlag: false,
            min: meta.min || 0,
            max: meta.max || 1,
            warning: meta.warning || []
          },
          hasBackdrop: false,
          disableClose: true,
          position: {
            top: '0em'
          },
          autoFocus: false,
          panelClass: [
            'no-padding-dialog',
            'w-100'
          ]
        }
      ).afterClosed().subscribe(
        () => this.dismissAllAddedLayers()
      )
    } catch (e) {
      console.error(e)
      this.snackbar.open(`Error loading nifti: ${e.toString()}`, 'Dismiss', {
        duration: 5000
      })
    }
  }
}
