import { Injectable } from "@angular/core";
import { ARIA_LABELS } from 'common/constants'
import { Inject, Optional } from "@angular/core";
import { select, Store } from "@ngrx/store";
import { Observable, of, Subject } from "rxjs";
import { map, scan, switchMap } from "rxjs/operators";
import { viewerStateSelectedTemplatePureSelector, viewerStateViewerModeSelector } from "src/services/state/viewerState/selectors";
import { NehubaViewerUnit } from "src/viewerModule/nehuba";
import { NEHUBA_INSTANCE_INJTKN } from "src/viewerModule/nehuba/util";
import { AnnotationService } from "../annotationService.service";
import { ToolPolygon } from "./poly";
import { AbsToolClass, ANNOTATION_EVENT_INJ_TOKEN, IAnnotationEvents, INgAnnotationTypes, TAnnotationEvent } from "./type";
import { switchMapWaitFor } from "src/util/fn";

const IAV_VOXEL_SIZES_NM = {
  'minds/core/referencespace/v1.0.0/265d32a0-3d84-40a5-926f-bf89f68212b9': [25000, 25000, 25000],
  'minds/core/referencespace/v1.0.0/d5717c4a-0fa1-46e6-918c-b8003069ade8': [39062.5, 39062.5, 39062.5],
  'minds/core/referencespace/v1.0.0/a1655b99-82f1-420f-a3c2-fe80fd4c8588': [21166.666015625, 20000, 21166.666015625],
  'minds/core/referencespace/v1.0.0/7f39f7be-445b-47c0-9791-e971c0b6d992': [1000000, 1000000, 1000000,],
  'minds/core/referencespace/v1.0.0/dafcffc5-4826-4bf1-8ff6-46b8a31ff8e2': [1000000, 1000000, 1000000]
}

@Injectable({
  providedIn: 'root'
})

export class ModularUserAnnotationToolService {

  static VIEWER_MODE = ARIA_LABELS.VIEWER_MODE_ANNOTATING

  static ANNOTATION_LAYER_NAME = 'modular_tool_layer_name'
  static USER_ANNOTATION_LAYER_SPEC = {
    "type": "annotation",
    "tool": "annotateBoundingBox",
    "name": ModularUserAnnotationToolService.ANNOTATION_LAYER_NAME,
    "annotationColor": "#ee00ff",
    "annotations": [],
  }

  private selectedTmpl: { fullId: string, name: string }
  private ngAnnotationLayer: any
  private activeToolName: string
  private ngAnnotations$ = new Subject<{
    tool: string
    annotations: INgAnnotationTypes[keyof INgAnnotationTypes][]
  }>()
  private registeredTool: {
    name: string
    iconClass: string
    ngOnDestroy?: Function
  }[] = []
  private mousePosReal: [number, number, number]

  /**
   * @description register new annotation tool
   * @param {AbsToolClass} Cls 
   */
  private registerTool(Cls: new (
    svc: Subject<TAnnotationEvent<keyof IAnnotationEvents>>
  ) => AbsToolClass){

    const newTool = new Cls(this.annotnEvSubj) as AbsToolClass & { ngOnDestroy?: Function }
    const { name, iconClass, ngOnDestroy } = newTool
    
    this.annotnSvc.moduleAnnotationTypes.push({
      instance: newTool,
      onClick: () => {
        const tool = this.activeToolName === name
          ? null
          : name
        this.activeToolName = tool
        this.annotnEvSubj.next({
          type: 'toolSelect',
          detail: { name: tool }
        } as TAnnotationEvent<'toolSelect'>)
      }
    })

    newTool.allNgAnnotations$.subscribe(ann => {
      this.ngAnnotations$.next({
        tool: name,
        annotations: ann
      })
    })

    this.registeredTool.push({ name, iconClass, ngOnDestroy })
  }

  /**
   * 
   * @description deregister tool. Calls any necessary clean up function
   * @param name name of the tool to be deregistered
   * @returns void
   */
  private deregisterTool(name: string) {
    this.annotnSvc.moduleAnnotationTypes = this.annotnSvc.moduleAnnotationTypes.filter(tool => tool.instance.name !== name)
    const foundIdx = this.registeredTool.findIndex(spec => spec.name === name)
    if (foundIdx >= 0) {
      const tool = this.registeredTool.splice(foundIdx, 1)[0]
      const { ngOnDestroy } = tool
      if (ngOnDestroy) ngOnDestroy.call(tool)
    }
  }


  constructor(
    private annotnSvc: AnnotationService,
    store: Store<any>,
    @Inject(ANNOTATION_EVENT_INJ_TOKEN) private annotnEvSubj: Subject<TAnnotationEvent<keyof IAnnotationEvents>>,
    @Optional() @Inject(NEHUBA_INSTANCE_INJTKN) nehubaViewer$: Observable<NehubaViewerUnit>,
  ){
    this.registerTool(ToolPolygon)

    /**
     * on new nehubaViewer, unset annotationLayer
     */
    nehubaViewer$.subscribe(() => {
      this.ngAnnotationLayer = null
    })

    /**
     * on new nehubaViewer, listen to mouseState
     */
    let cb: () => void
    nehubaViewer$.pipe(
      switchMap(switchMapWaitFor({
        condition: nv => !!(nv?.nehubaViewer),
      }))
    ).subscribe(nehubaViewer => {
      if (cb) cb()
      if (nehubaViewer) {
        const mouseState = nehubaViewer.nehubaViewer.ngviewer.mouseState
        cb = mouseState.changed.add(() => {
          const payload: IAnnotationEvents['hoverAnnotation'] = mouseState.active && !!mouseState.pickedAnnotationId
            ? {
              pickedAnnotationId: mouseState.pickedAnnotationId,
              pickedOffset: mouseState.pickedOffset
            }
            : null
          this.annotnEvSubj.next({
            type: 'hoverAnnotation',
            detail: payload
          })
        })
      }
    })

    /**
     * get mouse real position
     */
    nehubaViewer$.pipe(
      switchMap(v => v?.mousePosInReal$ || of(null))
    ).subscribe(v => this.mousePosReal = v)
    
    /**
     * listen to mouse event on nehubaViewer, and emit as TAnnotationEvent
     */
    this.annotnSvc.tmpAnnotationMouseEvent.subscribe(ev => {
      const payload = {
        type: ev.eventype,
        detail: {
          event: ev.event,
          ngMouseEvent: {
            x: this.mousePosReal[0],
            y: this.mousePosReal[1],
            z: this.mousePosReal[2]
          }
        }
      } as TAnnotationEvent<'mousedown' | 'mouseup' | 'mousemove'>
      this.annotnEvSubj.next(payload)
    })


    /**
     * on annotation update, update annotations
     */
    this.ngAnnotations$.pipe(
      switchMap(switchMapWaitFor({
        condition: () => !!this.ngAnnotationLayer
      })),
      scan((acc, curr) => {
        console.log(curr)
        return {
          ...acc,
          [curr.tool]: curr.annotations
        }
      }, {} as {
        [key: string]: INgAnnotationTypes[keyof INgAnnotationTypes][] 
      }),
      map(acc => {
        const out: INgAnnotationTypes[keyof INgAnnotationTypes][] = []
        for (const key in acc) {
          out.push(...acc[key])
        }
        return out
      })
    ).subscribe(val => {
      this.ngAnnotationLayer.layer.localAnnotations.restoreState(val)
    })

    /**
     * on viewer mode update, either create layer, or show/hide layer
     */
    store.pipe(
      select(viewerStateViewerModeSelector)
    ).subscribe(viewerMode => {
      if (viewerMode === ModularUserAnnotationToolService.VIEWER_MODE) {
        if (this.ngAnnotationLayer) this.ngAnnotationLayer.setVisible(true)
        else {
          const viewer = (window as any).viewer
          const voxelSize = IAV_VOXEL_SIZES_NM[this.selectedTmpl.fullId]
          if (!voxelSize) throw new Error(`voxelSize of ${this.selectedTmpl.fullId} cannot be found!`)
          const layer = viewer.layerSpecification.getLayer(
            ModularUserAnnotationToolService.ANNOTATION_LAYER_NAME,
            {
              ...ModularUserAnnotationToolService.USER_ANNOTATION_LAYER_SPEC,
              transform: [
                [1/voxelSize[0], 0, 0, 0],
                [0, 1/voxelSize[1], 0, 0],
                [0, 0, 1/voxelSize[2], 0],
                [0, 0, 0, 1],
              ]
            }
          )
          this.ngAnnotationLayer = viewer.layerManager.addManagedLayer(layer)
        }
      } else {
        if (this.ngAnnotationLayer) this.ngAnnotationLayer.setVisible(false)
      }
    })

    /**
     * on template select, update selectedtmpl
     * required for metadata in annotation geometry and voxel size
     */
    store.pipe(
      select(viewerStateSelectedTemplatePureSelector)
    ).subscribe(tmpl => {
      this.selectedTmpl = tmpl
    })
  }
}
