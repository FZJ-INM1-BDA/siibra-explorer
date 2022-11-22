import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Inject, OnDestroy, Optional, Output, TemplateRef, ViewChild } from "@angular/core";
import { select, Store } from "@ngrx/store";
import { ClickInterceptor, CLICK_INTERCEPTOR_INJECTOR } from "src/util";
import { distinctUntilChanged, map } from "rxjs/operators";
import { ARIA_LABELS, CONST } from 'common/constants'
import { IViewer, TViewerEvent } from "../../viewer.interface";
import { NehubaMeshService } from "../mesh.service";
import { NehubaLayerControlService, SET_COLORMAP_OBS, SET_LAYER_VISIBILITY } from "../layerCtrl.service";
import { getExportNehuba, getUuid } from "src/util/fn";
import { NG_LAYER_CONTROL, SET_SEGMENT_VISIBILITY } from "../layerCtrl.service/layerCtrl.util";
import { MatSnackBar } from "@angular/material/snack-bar";
import { getShader } from "src/util/constants";
import { EnumColorMapName } from "src/util/colorMaps";
import { MatDialog } from "@angular/material/dialog";
import { AtlasWorkerService } from "src/atlasViewer/atlasViewer.workerService.service";
import { SapiRegionModel } from "src/atlasComponents/sapi";
import { NehubaConfig } from "../config.service";
import { SET_MESHES_TO_LOAD } from "../constants";
import { atlasAppearance, atlasSelection, userInteraction } from "src/state";
import { linearTransform, TVALID_LINEAR_XFORM_DST, TVALID_LINEAR_XFORM_SRC } from "src/atlasComponents/sapi/core/space/interspaceLinearXform";
import { NgLayerCustomLayer } from "src/state/atlasAppearance";
import { arrayEqual } from "src/util/array";

export const INVALID_FILE_INPUT = `Exactly one (1) file is required!`

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

export class NehubaGlueCmp implements IViewer<'nehuba'>, AfterViewInit, OnDestroy {

  @ViewChild('layerCtrlTmpl', { static: true })
  layerCtrlTmpl: TemplateRef<any>

  public ARIA_LABELS = ARIA_LABELS
  public CONST = CONST

  private onhoverSegments: SapiRegionModel[] = []
  private onDestroyCb: (() => void)[] = []

  public nehubaConfig: NehubaConfig

  ngOnDestroy(): void {
    while (this.onDestroyCb.length) this.onDestroyCb.pop()()
  }

  @Output()
  public viewerEvent = new EventEmitter<TViewerEvent<'nehuba'>>()

  constructor(
    private store$: Store<any>,
    private snackbar: MatSnackBar,
    private dialog: MatDialog,
    private worker: AtlasWorkerService,
    @Optional() @Inject(CLICK_INTERCEPTOR_INJECTOR) clickInterceptor: ClickInterceptor,
  ){

    /**
     * define onclick behaviour
     */
    if (clickInterceptor) {
      const { deregister, register } = clickInterceptor
      const selOnhoverRegion = this.selectHoveredRegion.bind(this)
      register(selOnhoverRegion, { last: true })
      this.onDestroyCb.push(() => deregister(selOnhoverRegion))
    }

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

  ngAfterViewInit(): void {
    const customLayer = this.store$.pipe(
      select(atlasAppearance.selectors.customLayers),
      distinctUntilChanged(arrayEqual((o, n) => o.id === n.id)),
      map(cl => {
        const customLayers = cl.filter(l => l.clType === "customlayer/nglayer" && l.controllable)
        return customLayers
      }),
      distinctUntilChanged(),
    ).subscribe((l: NgLayerCustomLayer[]) => {
      if (l && l.length === 1) {
        this.openLayerController({layerName: l[0].id, fileName: l[0].source.split(',').pop()})
      }
    })
    this.onDestroyCb.push(() => customLayer.unsubscribe())
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
  public async handleFileDrop(files: File[]): Promise<void> {
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

    if (/\.swc$/i.test(file.name)) {
      let message = `The swc rendering is experimental. Please contact us on any feedbacks. `
      const swcText = await file.text()
      let src: TVALID_LINEAR_XFORM_SRC
      const dst: TVALID_LINEAR_XFORM_DST = "NEHUBA"
      if (/ccf/i.test(swcText)) {
        src = "CCF"
        message += `CCF detected, applying known transformation.`
      }
      if (!src) {
        message += `no known space detected. Applying default transformation.`
      }

      const xform = await linearTransform(src, dst)
      
      const url = URL.createObjectURL(file)
      this.droppedLayerNames.push({
        layerName: randomUuid,
        resourceUrl: url
      })
      this.store$.dispatch(
        atlasAppearance.actions.addCustomLayer({
          customLayer: {
            id: randomUuid,
            source: `swc://${url}`,
            segments: ["1"],
            transform: xform,
            clType: 'customlayer/nglayer' as const
          }
        })
      )
      this.snackbar.open(message, "Dismiss", {
        duration: 10000
      })
      return
    }
     
    
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
      const { result } = await this.worker.sendMessage({
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

      this.openLayerController({layerName: randomUuid,
        fileName: file.name,
        min: meta.min || 0,
        max: meta.max || 1,
        warning: meta.warning || []})
      
    } catch (e) {
      console.error(e)
      this.snackbar.open(`Error loading nifti: ${e.toString()}`, 'Dismiss', {
        duration: 5000
      })
    }
  }

  openLayerController(meta: {layerName: string, fileName: string, min?: number, max?: number, warning?: any[]}) {
    this.dialog.open(
      this.layerCtrlTmpl,
      {
        data: {
          layerName: meta.layerName,
          filename: meta.fileName,
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
  }
}
