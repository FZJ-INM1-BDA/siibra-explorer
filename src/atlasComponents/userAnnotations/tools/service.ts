import { Injectable, OnDestroy } from "@angular/core";
import { ARIA_LABELS } from 'common/constants'
import { Inject, Optional } from "@angular/core";
import { select, Store } from "@ngrx/store";
import { BehaviorSubject, combineLatest, fromEvent, merge, Observable, of, Subject, Subscription } from "rxjs";
import { map, switchMap, filter } from "rxjs/operators";
import { viewerStateSelectedTemplatePureSelector, viewerStateViewerModeSelector } from "src/services/state/viewerState/selectors";
import { NehubaViewerUnit } from "src/viewerModule/nehuba";
import { NEHUBA_INSTANCE_INJTKN } from "src/viewerModule/nehuba/util";
import { Polygon, ToolPolygon } from "./poly";
import { AbsToolClass, ANNOTATION_EVENT_INJ_TOKEN, IAnnotationEvents, IAnnotationGeometry, INgAnnotationTypes, INJ_ANNOT_TARGET, TAnnotationEvent, ClassInterface, TExportFormats, TCallbackFunction } from "./type";
import { switchMapWaitFor } from "src/util/fn";
import {Line, ToolLine} from "src/atlasComponents/userAnnotations/tools/line";
import { PolyUpdateCmp } from './poly/poly.component'
import { Point, ToolPoint } from "./point";
import { PointUpdateCmp } from "./point/point.component";
import { LineUpdateCmp } from "./line/line.component";

const IAV_VOXEL_SIZES_NM = {
  'minds/core/referencespace/v1.0.0/265d32a0-3d84-40a5-926f-bf89f68212b9': [25000, 25000, 25000],
  'minds/core/referencespace/v1.0.0/d5717c4a-0fa1-46e6-918c-b8003069ade8': [39062.5, 39062.5, 39062.5],
  'minds/core/referencespace/v1.0.0/a1655b99-82f1-420f-a3c2-fe80fd4c8588': [21166.666015625, 20000, 21166.666015625],
  'minds/core/referencespace/v1.0.0/7f39f7be-445b-47c0-9791-e971c0b6d992': [1000000, 1000000, 1000000,],
  'minds/core/referencespace/v1.0.0/dafcffc5-4826-4bf1-8ff6-46b8a31ff8e2': [1000000, 1000000, 1000000]
}

function scanCollapse<T>(){
  return (src: Observable<{
    tool: string
    annotations: T[]
  }>) => new Observable<T[]>(obs => {
    const cache: {
      [key: string]: T[]
    } = {}
    src.subscribe({
      next: val => {
        const { annotations, tool } = val
        cache[tool] = annotations
        const out: T[] = []
        for (const key in cache) {
          out.push(...cache[key])
        }
        obs.next(out)
      },
      complete: obs.complete,
      error: obs.error
    })
  })
}

@Injectable({
  providedIn: 'root'
})

export class ModularUserAnnotationToolService implements OnDestroy{

  private subscription: Subscription[] = []

  static TMP_PREVIEW_ANN_ID = 'tmp_preview_ann_id'
  static VIEWER_MODE = ARIA_LABELS.VIEWER_MODE_ANNOTATING

  static ANNOTATION_LAYER_NAME = 'modular_tool_layer_name'
  static USER_ANNOTATION_LAYER_SPEC = {
    "type": "annotation",
    "tool": "annotateBoundingBox",
    "name": ModularUserAnnotationToolService.ANNOTATION_LAYER_NAME,
    "annotationColor": "#ee00ff",
    "annotations": [],
  }

  private previewNgAnnIds: string[] = []

  private ngAnnotationLayer: any
  private activeToolName: string
  private forcedAnnotationRefresh$ = new BehaviorSubject(null)
  private ngAnnotations$ = new Subject<{
    tool: string
    annotations: INgAnnotationTypes[keyof INgAnnotationTypes][]
  }>()


  private selectedTmpl: any
  public moduleAnnotationTypes: {instance: {name: string, iconClass: string, toolSelected$: Observable<boolean>}, onClick: Function}[] = []
  private managedAnnotationsStream$ = new Subject<{
    tool: string
    annotations: IAnnotationGeometry[]
  }>()

  private managedAnnotations: IAnnotationGeometry[] = []
  public managedAnnotations$ = this.managedAnnotationsStream$.pipe(
    scanCollapse(),
  )

  private registeredTools: {
    name: string
    iconClass: string
    target?: ClassInterface<IAnnotationGeometry>
    editCmp?: ClassInterface<any>
    onMouseMoveRenderPreview: (pos: [number, number, number]) => INgAnnotationTypes[keyof INgAnnotationTypes][]
    onDestoryCallBack: () => void
  }[] = []
  private mousePosReal: [number, number, number]

  private handleToolCallback: TCallbackFunction = arg => {
    switch (arg.type) {
    case 'paintingEnd': {
      this.deselectTools()
      return
    }
    }
  }

  /**
   * @description register new annotation tool
   * Some tools (deletion / dragging) may not have target and editCmp 
   * 
   * @param {{
   *   toolCls: ClassInterface<AbsToolClass>
   *   target?: ClassInterface<IAnnotationGeometry>
   *   editCmp?: ClassInterface<any>
   * }} arg 
   */
  private registerTool<T extends AbsToolClass>(arg: {
    toolCls: ClassInterface<T>
    target?: ClassInterface<IAnnotationGeometry>
    editCmp?: ClassInterface<any>
  }){
    const { toolCls: Cls, target, editCmp } = arg
    const newTool = new Cls(this.annotnEvSubj, arg => this.handleToolCallback(arg)) as AbsToolClass & { ngOnDestroy?: Function }
    const { name, iconClass, onMouseMoveRenderPreview } = newTool
    
    this.moduleAnnotationTypes.push({
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

    const toolSubscriptions: Subscription[] = []

    toolSubscriptions.push(
      newTool.allNgAnnotations$.subscribe(ann => {
        this.ngAnnotations$.next({
          tool: name,
          annotations: ann
        })
      }),
      newTool.managedAnnotations$.subscribe(ann => {
        this.managedAnnotationsStream$.next({
          annotations: ann,
          tool: name
        })
      })
    )

    this.registeredTools.push({
      name,
      iconClass,
      target,
      editCmp,
      onMouseMoveRenderPreview: onMouseMoveRenderPreview.bind(newTool),
      onDestoryCallBack: () => {
        newTool.ngOnDestroy && newTool.ngOnDestroy()
        this.managedAnnotationsStream$.next({
          annotations: [],
          tool: name
        })
        while(toolSubscriptions.length > 0) toolSubscriptions.pop().unsubscribe()
      }
    })
  }

  /**
   *
   * @description deregister tool. Calls any necessary clean up function
   * @param name name of the tool to be deregistered
   * @returns void
   */
  private deregisterTool(name: string) {
    this.moduleAnnotationTypes = this.moduleAnnotationTypes.filter(tool => tool.instance.name !== name)
    const foundIdx = this.registeredTools.findIndex(spec => spec.name === name)
    if (foundIdx >= 0) {
      const tool = this.registeredTools.splice(foundIdx, 1)[0]
      tool.onDestoryCallBack()
    }
  }

  constructor(
    store: Store<any>,
    @Inject(INJ_ANNOT_TARGET) annotTarget$: Observable<HTMLElement>,
    @Inject(ANNOTATION_EVENT_INJ_TOKEN) private annotnEvSubj: Subject<TAnnotationEvent<keyof IAnnotationEvents>>,
    @Optional() @Inject(NEHUBA_INSTANCE_INJTKN) nehubaViewer$: Observable<NehubaViewerUnit>,
  ){

    this.registerTool({
      toolCls: ToolPoint,
      target: Point,
      editCmp: PointUpdateCmp,
    })

    this.registerTool({
      toolCls: ToolLine,
      target: Line,
      editCmp: LineUpdateCmp,
    })

    this.registerTool({
      toolCls: ToolPolygon,
      target: Polygon,
      editCmp: PolyUpdateCmp,
    })

    /**
     * listen to mouse event on nehubaViewer, and emit as TAnnotationEvent
     */
    this.subscription.push(
      annotTarget$.pipe(
        switchMap(el => {
          if (!el) return of(null)
          return merge(...(
            ['mousedown', 'mouseup', 'mousemove'].map(type =>
              fromEvent(el, type, { capture: true }).pipe(
                map((ev: MouseEvent) => {
                  return {
                    type: type,
                    event: ev,
                  }
                }),
                // filter(ev => ev.event.target)
              )
            )
          ))
        }),
        filter(v => !!v)
      ).subscribe(ev => {
        /**
         * do not emit if any mousePosReal is NaN
         */
        if (!this.mousePosReal || this.mousePosReal.some(p => isNaN(p))) return
        const payload = {
          type: ev.type,
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
    )

    /**
     * on new nehubaViewer, unset annotationLayer
     */
    this.subscription.push(
      nehubaViewer$.subscribe(() => {
        this.ngAnnotationLayer = null
      })
    )

    /**
     * on new nehubaViewer, listen to mouseState
     */
    let cb: () => void
    this.subscription.push(
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
    )

    /**
     * get mouse real position
     */
    this.subscription.push(
      nehubaViewer$.pipe(
        switchMap(v => v?.mousePosInReal$ || of(null))
      ).subscribe(v => this.mousePosReal = v)
    )

    /**
     * on mouse move, render preview annotation
     */
    this.subscription.push(
      this.annotnEvSubj.pipe(
        filter(ev => ev.type === 'toolSelect')
      ).pipe(
        switchMap((toolSelEv: TAnnotationEvent<'toolSelect'>) => {
          /**
           * on new tool set (or unset) remove existing preview annotations, if exist
           */
          while (this.previewNgAnnIds.length > 0) {
            this.clearAllPreviewAnnotations()
          }
          if (!toolSelEv.detail.name) return of(null)
          return this.annotnEvSubj.pipe(
            filter(v => v.type === 'mousemove'),
            map((ev: TAnnotationEvent<'mousemove'>) => {
              return {
                selectedToolName: toolSelEv.detail.name,
                ngMouseEvent: ev.detail.ngMouseEvent
              }
            })
          )
        })
      ).subscribe((ev: {
        selectedToolName: string
        ngMouseEvent: {x: number, y: number, z: number}
      }) => {
        if (!ev) {
          this.clearAllPreviewAnnotations()
          return
        }
        const { selectedToolName, ngMouseEvent } = ev
        const selectedTool = this.registeredTools.find(tool => tool.name === selectedToolName)
        if (!selectedTool) {
          console.warn(`cannot find tool ${selectedToolName}`)
          return
        }
        const { onMouseMoveRenderPreview } = selectedTool
        const previewNgAnnotation = onMouseMoveRenderPreview([ngMouseEvent.x, ngMouseEvent.y, ngMouseEvent.z])

        if (this.previewNgAnnIds.length !== previewNgAnnotation.length) {
          this.clearAllPreviewAnnotations()
        }
        for (let idx = 0; idx < previewNgAnnotation.length; idx ++) {
          const localAnnotations = this.ngAnnotationLayer.layer.localAnnotations
          const annSpec = {
            ...parseNgAnnotation(previewNgAnnotation[idx]),
            id: `${ModularUserAnnotationToolService.TMP_PREVIEW_ANN_ID}_${idx}`
          }
          const annRef = localAnnotations.references.get(annSpec.id)
          if (annRef) {
            localAnnotations.update(
              annRef,
              annSpec
            )
          } else {
            localAnnotations.add(
              annSpec
            )
          }
          this.previewNgAnnIds[idx] = annSpec.id
        }
      })
    )

    /**
     * on tool managed annotations update, update annotations
     */
    this.subscription.push(
      combineLatest([
        this.forcedAnnotationRefresh$,
        this.ngAnnotations$.pipe(
          switchMap(switchMapWaitFor({
            condition: () => !!this.ngAnnotationLayer,
            leading: true
          })),
          scanCollapse(),
        )
      ]).pipe(
        map(([_, ngAnnos]) => ngAnnos),
      ).subscribe(arr => {
        const ignoreNgAnnIdsSet = new Set<string>()
        for (const hiddenAnnot of this.hiddenAnnotations) {
          const ids = hiddenAnnot.getNgAnnotationIds()
          for (const id of ids) {
            ignoreNgAnnIdsSet.add(id)
          }
        }
        for (const annotation of arr) {
          if (ignoreNgAnnIdsSet.has(annotation.id)) {
            this.deleteNgAnnotationById(annotation.id)
            continue
          }
          const localAnnotations = this.ngAnnotationLayer.layer.localAnnotations
          const annRef = localAnnotations.references.get(annotation.id)
          const annSpec = parseNgAnnotation(annotation)
          if (annRef) {
            localAnnotations.update(
              annRef,
              annSpec
            )
          } else {
            localAnnotations.add(
              annSpec
            )
          }
        }
      })
    )

    /**
     * on viewer mode update, either create layer, or show/hide layer
     */
    this.subscription.push(
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
    )

    /**
     * on template select, update selectedtmpl
     * required for metadata in annotation geometry and voxel size
     */
    this.subscription.push(
      store.pipe(
        select(viewerStateSelectedTemplatePureSelector)
      ).subscribe(tmpl => {
        this.selectedTmpl = tmpl
        this.annotnEvSubj.next({
          type: 'metadataEv',
          detail: {
            space: tmpl && { ['@id']: tmpl['@id'] }
          }
        })
      }),
      this.managedAnnotations$.subscribe(ann => this.managedAnnotations = ann),
    )
  }

  private hiddenAnnotationIds = new Set<string>()

  public hiddenAnnotations$ = new BehaviorSubject<IAnnotationGeometry[]>([])
  private hiddenAnnotations: IAnnotationGeometry[] = []
  public toggleAnnotationVisibilityById(id: string){
    if (this.hiddenAnnotationIds.has(id)) this.hiddenAnnotationIds.delete(id)
    else this.hiddenAnnotationIds.add(id)

    this.hiddenAnnotations = []
    for (const id of Array.from(this.hiddenAnnotationIds)) {
      const found = this.managedAnnotations.find(managedAnn => managedAnn.id === id)
      if (found) {
        this.hiddenAnnotations.push(found)
      }
    }
    this.hiddenAnnotations$.next(this.hiddenAnnotations)
    this.forcedAnnotationRefresh$.next(null)
  }

  public getEditAnnotationCmp(annotation: IAnnotationGeometry): ClassInterface<any>{
    const foundTool = this.registeredTools.find(t => annotation instanceof t.target)
    return foundTool && foundTool.editCmp
  }

  private clearAllPreviewAnnotations(){
    while (this.previewNgAnnIds.length > 0) this.deleteNgAnnotationById(this.previewNgAnnIds.pop())
  }

  private deleteNgAnnotationById(annId: string) {
    const localAnnotations = this.ngAnnotationLayer.layer.localAnnotations
    const annRef = localAnnotations.references.get(annId)
    if (annRef) {
      localAnnotations.delete(annRef)
      localAnnotations.references.delete(annId)
    }
  }

  public deselectTools(){

    // TODO refactor
    this.activeToolName = null
    this.annotnEvSubj.next({
      type: 'toolSelect',
      detail: {
        name: null
      }
    })
  }

  ngOnDestroy(){
    while(this.subscription.length > 0) this.subscription.pop().unsubscribe()
  }
}

export function parseNgAnnotation(ann: INgAnnotationTypes[keyof INgAnnotationTypes]){
  let overwritingType = null
  if (ann.type === 'point') overwritingType = 0
  if (ann.type === 'line') overwritingType = 1
  if (overwritingType === null) throw new Error(`overwrite type lookup failed for ${ann.type}`)
  return {
    ...ann,
    type: overwritingType
  }
}
