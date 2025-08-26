import { Injectable, OnDestroy, Type } from "@angular/core";
import { ARIA_LABELS } from 'common/constants'
import { Inject, Optional } from "@angular/core";
import { select, Store } from "@ngrx/store";
import { BehaviorSubject, combineLatest, fromEvent, merge, Observable, of, Subject, Subscription } from "rxjs";
import {map, switchMap, filter, shareReplay, pairwise, distinctUntilChanged, take, withLatestFrom, scan } from "rxjs/operators";
import { NehubaViewerUnit } from "src/viewerModule/nehuba";
import { NEHUBA_INSTANCE_INJTKN } from "src/viewerModule/nehuba/util";
import { AbsToolClass, ANNOTATION_EVENT_INJ_TOKEN, IAnnotationEvents, IAnnotationGeometry, INgAnnotationTypes, INJ_ANNOT_TARGET, TAnnotationEvent, ClassInterface, TCallbackFunction, TSands, TGeometryJson, TCallback, DESC_TYPE } from "./type";
import { getExportNehuba, retry, switchMapWaitFor } from "src/util/fn";
import { Polygon } from "./poly";
import { Line } from "./line";
import { Point } from "./point";
import { FilterAnnotationsBySpace } from "../filterAnnotationBySpace.pipe";
import { MatSnackBar } from 'src/sharedModules/angularMaterial.exports'
import { actions } from "src/state/atlasSelection";
import { atlasSelection } from "src/state";
import { AnnotationLayer, getViewer } from "src/atlasComponents/annotations";
import { translateV3Entities } from "src/atlasComponents/sapi/translateV3";
import { HOVER_INTERCEPTOR_INJECTOR, HoverInterceptor, THoverConfig } from "src/util/injectionTokens";
import { ToolCmpBase } from "./toolCmp.base";


const ANNOTATED_SYMBOL = Symbol("ANNOTATED_SYMBOL")
const LOCAL_STORAGE_KEY = 'userAnnotationKey'
const ANNOTATION_LAYER_NAME = "modular_tool_layer_name"

type TAnnotationMetadata = {
  id: string
  name: string
  desc: string
}

type TTypedAnnMetadata = {
  '@type': 'siibra-ex/meta/desc'
} & TAnnotationMetadata

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

export type RegisteredTool = {
  name: string
  iconClass: string
  toolInstance: AbsToolClass<IAnnotationGeometry>
  target?: Type<IAnnotationGeometry>
  editCmp?: Type<ToolCmpBase>
  onDestoryCallBack: () => void
  onClick: () => void
}

@Injectable({
  providedIn: 'root'
})

export class ModularUserAnnotationToolService implements OnDestroy{

  private subscription: Subscription[] = []

  static TMP_PREVIEW_ANN_ID = 'tmp_preview_ann_id'
  static VIEWER_MODE = ARIA_LABELS.VIEWER_MODE_ANNOTATING

  
  static USER_ANNOTATION_LAYER_SPEC = {
    "type": "annotation",
    "tool": "annotateBoundingBox",
    "name": ANNOTATION_LAYER_NAME,
    "annotationColor": "#ee00ff",
    "annotations": [],
  }

  private previewNgAnnIds: string[] = []

  #annotationLayerVisible = false
  private annotationLayer: AnnotationLayer
  private activeToolName: string
  private forcedAnnotationRefresh$ = new BehaviorSubject(null)

  private selectedTmpl$ = this.store.pipe(
    select(atlasSelection.selectors.selectedTemplate),
  )

  #registerAnnotationTool$ = new Subject<RegisteredTool>()
  annotationTools$ = this.#registerAnnotationTool$.pipe(
    scan((acc, curr) => acc.concat(curr), [] as RegisteredTool[]),
    shareReplay(1),
  )
  private managedAnnotationsStream$ = new Subject<{
    tool: string
    annotations: IAnnotationGeometry[]
  }>()

  private filterAnnotationBySpacePipe = new FilterAnnotationsBySpace()
  public managedAnnotations$ = this.managedAnnotationsStream$.pipe(
    scanCollapse(),
    shareReplay(1),
  )

  public otherSpaceManagedAnnotations$ = combineLatest([
    this.selectedTmpl$,
    this.managedAnnotations$
  ]).pipe(
    map(([tmpl, annts]) => {
      return this.filterAnnotationBySpacePipe.transform(
        annts,
        tmpl,
        { reverse: true }
      )
    })
  )

  public spaceFilteredManagedAnnotations$ = combineLatest([
    this.selectedTmpl$,
    this.managedAnnotations$
  ]).pipe(
    map(([tmpl, annts]) => {
      return this.filterAnnotationBySpacePipe.transform(
        annts,
        tmpl
      )
    })
  )

  public badges$ = this.spaceFilteredManagedAnnotations$.pipe(
    map(mann => mann.length > 0 ? mann.length : null)
  )

  public hoveringAnnotations$ = this.annotnEvSubj.pipe(
    filter<TAnnotationEvent<'hoverAnnotation'>>(ev => ev.type === 'hoverAnnotation'),
    withLatestFrom(this.managedAnnotations$),
    map(([ev, managedAnnotations]) => {
      if (!(ev?.detail)) return null
      const { pickedAnnotationId } = ev.detail
      const annId = (pickedAnnotationId || '').split('_')[0]
      const foundAnn = managedAnnotations.find(ann => ann.id === annId)
      if (!foundAnn) return null
      return foundAnn
    })
  )

  private mousePosReal: [number, number, number]

  public toolEvents = new Subject()
  private handleToolCallback: TCallbackFunction = arg => {
    this.toolEvents.next(arg)
    switch (arg.type) {
    case 'paintingEnd': {
      this.deselectTools()
      return
    }
    case 'requestManAnnStream': {
      return this.managedAnnotations$
    }
    case 'message': {
      const d = (arg as TCallback['message']['callArg'] & { type: any })
      const { message, actionCallback, action = null } = d
      this.snackbar.open(message, action, {
        duration: 5000
      }).afterDismissed().subscribe(({ dismissedByAction }) => {
        if (dismissedByAction && actionCallback) actionCallback()
      })
      return
    }
    case 'showList': {
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
  public registerTool<T extends AbsToolClass<IAnnotationGeometry>>(arg: {
    toolCls: ClassInterface<T>
    target?: ClassInterface<IAnnotationGeometry>
    editCmp?: ClassInterface<ToolCmpBase>
  }): AbsToolClass<any>{
    const { toolCls: Cls, target, editCmp } = arg
    const newTool = new Cls(this.annotnEvSubj, arg => this.handleToolCallback(arg)) as T & { ngOnDestroy?: () => void }
    const { name, iconClass } = newTool
    
    const toolSubscriptions: Subscription[] = []

    this.#registerAnnotationTool$.next({
      toolInstance: newTool,
      onClick: () => {
        const tool = this.activeToolName === name
          ? null
          : name
        this.activeToolName = tool
        this.annotnEvSubj.next({
          type: 'toolSelect',
          detail: { name: tool }
        } as TAnnotationEvent<'toolSelect'>)
      },
      iconClass,
      name,
      target,
      editCmp,
      onDestoryCallBack: () => {
        newTool.ngOnDestroy && newTool.ngOnDestroy()
        this.managedAnnotationsStream$.next({
          annotations: [],
          tool: name
        })
        while(toolSubscriptions.length > 0) toolSubscriptions.pop().unsubscribe()
      }
    })

    const { managedAnnotations$ } = newTool

    if ( managedAnnotations$ ){
      toolSubscriptions.push(
        managedAnnotations$.subscribe(ann => {
          this.managedAnnotationsStream$.next({
            annotations: ann,
            tool: name
          })
        })
      )
    }
    return newTool
  }

  #hoverMsgs: THoverConfig[] = []

  #dismimssHoverMsgs(){
    if (!this.hoverInterceptor) {
      return
    }
    const { remove } = this.hoverInterceptor
    for (const msg of this.#hoverMsgs){
      remove(msg)
    }
  }
  #appendHoverMsgs(geometries: IAnnotationGeometry[]){
    if (!this.hoverInterceptor) {
      return
    }
    const { append } = this.hoverInterceptor
    this.#hoverMsgs = geometries.map(geom => {
      let fontIcon = 'fa-file'
      if (geom.annotationType === 'Point') {
        fontIcon = 'fa-circle'
      }
      if (geom.annotationType === 'Line') {
        fontIcon = 'fa-slash'
      }
      if (geom.annotationType === 'Polygon') {
        fontIcon = 'fa-draw-polygon'
      }
      return {
        message: geom.name || `Unnamed ${geom.annotationType}`,
        fontSet: 'fas',
        fontIcon
      }
    })
    for (const msg of this.#hoverMsgs){
      append(msg)
    }
  }

  constructor(
    private store: Store<any>,
    private snackbar: MatSnackBar,
    @Inject(INJ_ANNOT_TARGET) annotTarget$: Observable<HTMLElement>,
    @Inject(ANNOTATION_EVENT_INJ_TOKEN) private annotnEvSubj: Subject<TAnnotationEvent<keyof IAnnotationEvents>>,
    @Optional() @Inject(NEHUBA_INSTANCE_INJTKN) nehubaViewer$: Observable<NehubaViewerUnit>,
    @Optional() @Inject(HOVER_INTERCEPTOR_INJECTOR) 
    private hoverInterceptor: HoverInterceptor,
  ){

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
      }),
      this.hoveringAnnotations$.subscribe(ev => {
        this.#dismimssHoverMsgs()
        if (ev) {
          this.#appendHoverMsgs([ev])
        }
      }),
    )

    /**
     * on new nehubaViewer, unset annotationLayer
     */
    if (!!nehubaViewer$) {
  
      /**
       * get mouse real position
       */
      this.subscription.push(
        nehubaViewer$.pipe(
          switchMap(v => v?.mousePosInReal$ || of(null))
        ).subscribe(v => this.mousePosReal = v)
      )  
    }
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
          if (!toolSelEv.detail.name) return of(null as {
            selectedToolName: string
            ngMouseEvent: {x: number, y: number, z: number}
          })
          return this.annotnEvSubj.pipe(
            filter(v => v.type === 'mousemove'),
            map((ev: TAnnotationEvent<'mousemove'>) => {
              return {
                selectedToolName: toolSelEv.detail.name,
                ngMouseEvent: ev.detail.ngMouseEvent
              }
            })
          )
        }),
        withLatestFrom(this.annotationTools$)
      ).subscribe(([ev, tools]) => {
        if (!ev) {
          this.clearAllPreviewAnnotations()
          return
        }
        const { selectedToolName, ngMouseEvent } = ev
        const selectedTool = tools.find(tool => tool.name === selectedToolName)
        if (!selectedTool) {
          console.warn(`cannot find tool ${selectedToolName}`)
          return
        }
        const { toolInstance } = selectedTool
        const previewNgAnnotation = toolInstance.onMouseMoveRenderPreview
          ? toolInstance.onMouseMoveRenderPreview([ngMouseEvent.x, ngMouseEvent.y, ngMouseEvent.z])
          : []

        if (this.previewNgAnnIds.length !== previewNgAnnotation.length) {
          this.clearAllPreviewAnnotations()
        }
        for (let idx = 0; idx < previewNgAnnotation.length; idx ++) {
          const spec = {
            ...previewNgAnnotation[idx],
            id: `${ModularUserAnnotationToolService.TMP_PREVIEW_ANN_ID}_${idx}`
          }
          this.annotationLayer.updateAnnotation(spec)
          this.previewNgAnnIds[idx] = spec.id
        }
      })
    )

    /**
     * on tool managed annotations update
     */
    const spaceFilteredManagedAnnotationUpdate$ = combineLatest([
      this.forcedAnnotationRefresh$,
      this.spaceFilteredManagedAnnotations$.pipe(
        switchMap(switchMapWaitFor({
          condition: () => !!this.annotationLayer,
          leading: true
        })),
      )
    ]).pipe(
      map(([_, annts]) => 
        annts.map(ann => ann.toNgAnnotation()).flatMap(v => v)
      ),
      shareReplay(1),
    )
    this.subscription.push(
      // delete removed annotations
      spaceFilteredManagedAnnotationUpdate$.pipe(
        pairwise(),
        filter(([ oldAnn, newAnn ]) => newAnn.length < oldAnn.length),
      ).subscribe(([ oldAnn, newAnn ]) => {
        const newAnnIdSet = new Set(newAnn.map(ann => ann.id))
        const outs = oldAnn.filter(ann => !newAnnIdSet.has(ann.id))
        for (const out of outs){
          this.deleteNgAnnotationById(out.id)
        }
      }), 
      //update annotations
      spaceFilteredManagedAnnotationUpdate$.subscribe(arr => {
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
          if (!this.annotationLayer) continue
          this.annotationLayer.updateAnnotation(annotation)
        }
      })
    )

    /**
     * on viewer mode update, either create layer, or show/hide layer
     */
    // this.subscription.push(
    //   store.pipe(
    //     select(atlasSelection.selectors.viewerMode),
    //     withLatestFrom(
    //       this.#voxelSize,
    //       this.store.pipe(
    //         select(atlasAppearance.selectors.useViewer)
    //       )
    //     ),
    //     filter(([_viewerMode, _voxelSize, useViewer]) => useViewer === "NEHUBA"),
    //     switchMap(([viewerMode, voxelSize, _useViewer]) => from(
    //       retry(() => {
    //         if (this.annotationLayer) {
    //           return this.annotationLayer
    //         }
    //         if (!voxelSize) {
    //           throw new Error(`voxelSize of ${this.selectedTmpl.id} cannot be found!`)
    //         }
    //         this.annotationLayer = new AnnotationLayer(
    //           ANNOTATION_LAYER_NAME,
    //           ModularUserAnnotationToolService.USER_ANNOTATION_LAYER_SPEC.annotationColor
    //         )
    //         this.annotationLayer.onHover.subscribe(val => {
    //           this.annotnEvSubj.next({
    //             type: 'hoverAnnotation',
    //             detail: val
    //               ? {
    //                 pickedAnnotationId: val.id,
    //                 pickedOffset: val.offset
    //               }
    //               : null
    //           })
    //         })
            
    //         return this.annotationLayer
    //       }, { retries: 60, timeout: 1000 })
    //       ).pipe(
    //         map(annotationLayer => ({viewerMode, annotationLayer}))
    //       )
    //     )
    //   ).subscribe(({viewerMode, annotationLayer}) => {
    //     this.currMode = viewerMode
        
    //     /**
    //      * on template changes, the layer gets lost
    //      * force redraw annotations if layer needs to be recreated
    //      */
    //     this.forcedAnnotationRefresh$.next(null)
    //     annotationLayer.setVisible(viewerMode === ModularUserAnnotationToolService.VIEWER_MODE)
    //   })
    // )
    const templateIsVolumetric$ = this.store.pipe(
      select(atlasSelection.selectors.selectedTemplate),
      distinctUntilChanged((o, n) => o?.id === n?.id),
      switchMap(tmpl => translateV3Entities.translateSpaceToVolumeImage(tmpl)),
      map(volImages => volImages.length > 0),
    )

    this.subscription.push(
      this.selectedTmpl$.pipe(
        distinctUntilChanged((o, n) => o?.id === n?.id)
      ).subscribe(() => {
        if (this.annotationLayer) {
          this.annotationLayer.dispose()
          this.annotationLayer = null
        }
      }),
      templateIsVolumetric$.pipe(
        withLatestFrom(this.store.pipe(
          select(atlasSelection.selectors.selectedTemplate)
        ))
      ).subscribe(async ([flag, selectedTmpl]) => {
        let sub: Subscription
        if (sub) {
          sub.unsubscribe()
          sub = null
        }
  
        if (!flag) {
          return
        }
        const viewer = await retry(() => {
          const viewer = getViewer()
          if (viewer && !viewer[ANNOTATED_SYMBOL]) {
            return viewer
          }
          throw new Error(`viewer not defined, or already annotated`)
        }, { timeout: 160, retries: 100 })

        viewer[ANNOTATED_SYMBOL] = selectedTmpl?.id
        
        this.annotationLayer = new AnnotationLayer(
          ANNOTATION_LAYER_NAME,
          ModularUserAnnotationToolService.USER_ANNOTATION_LAYER_SPEC.annotationColor
        )

        this.annotationLayer.setVisible(this.#annotationLayerVisible)
        
        sub = this.annotationLayer.onHover.subscribe(val => {
          this.annotnEvSubj.next({
            type: 'hoverAnnotation',
            detail: val
              ? {
                pickedAnnotationId: val.id,
                pickedOffset: val.offset
              }
              : null
          })
        })
        this.forcedAnnotationRefresh$.next(null)
      }),
    )
    /**
     * on template select, update selectedtmpl
     * required for metadata in annotation geometry and voxel size
     */
    this.subscription.push(
      this.selectedTmpl$.subscribe(tmpl => {
        this.annotnEvSubj.next({
          type: 'metadataEv',
          detail: {
            space: tmpl
          }
        })
        this.forcedAnnotationRefresh$.next(null)
      }),
    )

  }

  /**
   * ensure that loadStoredAnnotation only gets called once
   */
  private loadFlag = false

  /**
   * @deprecated No longer storing local annotations
   */
  public async loadStoredAnnotations(){
    if (this.loadFlag) return
    this.loadFlag = true
    
    const encoded = window.localStorage.getItem(LOCAL_STORAGE_KEY)
    if (!encoded) return []
    const bin = atob(encoded)
    window.localStorage.removeItem(LOCAL_STORAGE_KEY)
    
    const { pako } = await getExportNehuba()
    const decoded = pako.inflate(bin, { to: 'string' })
    const arr = JSON.parse(decoded)
    const anns: IAnnotationGeometry[] = []
    for (const obj of arr) {
      const geometry = this.parseAnnotationObject(obj)
      if (geometry) anns.push(geometry)
    }
    
    this.annotationTools$.pipe(
      take(1),
    ).subscribe(tools => {
      
      for (const ann of anns) {
        
        for (const tool of tools) {
          const { toolInstance, target } = tool
          if (!!target && ann instanceof target) {
            toolInstance.addAnnotation(ann)
            return
          }
        }
      }
    })
  }

  /**
   * stop gap measure when exporting/import annotations in sands format
   * metadata (name/desc) will be saved in a separate metadata file
   */
  private metadataMap = new Map<string, TAnnotationMetadata>()

  private hiddenAnnotationIds = new Set<string>()

  public hiddenAnnotations$ = new BehaviorSubject<IAnnotationGeometry[]>([])
  private hiddenAnnotations: IAnnotationGeometry[] = []
  public async toggleAnnotationVisibilityById(id: string){
    if (this.hiddenAnnotationIds.has(id)) this.hiddenAnnotationIds.delete(id)
    else this.hiddenAnnotationIds.add(id)

    this.hiddenAnnotations = []
    const managedAnnotations = await this.managedAnnotations$.pipe(
      take(1)
    ).toPromise()
    for (const id of Array.from(this.hiddenAnnotationIds)) {
      const found = managedAnnotations.find(managedAnn => managedAnn.id === id)
      if (found) {
        this.hiddenAnnotations.push(found)
      }
    }
    this.hiddenAnnotations$.next(this.hiddenAnnotations)
    this.forcedAnnotationRefresh$.next(null)
  }

  private clearAllPreviewAnnotations(){
    while (this.previewNgAnnIds.length > 0) this.deleteNgAnnotationById(this.previewNgAnnIds.pop())
  }

  private deleteNgAnnotationById(annId: string) {
    this.annotationLayer.removeAnnotation({ id: annId })
  }

  public defaultTool: AbsToolClass<any>
  public deselectTools(){

    this.activeToolName = null
    this.annotnEvSubj.next({
      type: 'toolSelect',
      detail: {
        name: this.defaultTool.name || null
      }
    })
  }

  parseAnnotationObject(json: TSands | TGeometryJson | TTypedAnnMetadata): IAnnotationGeometry | null{
    let returnObj: IAnnotationGeometry
    if (json['@type'] === 'tmp/poly') {
      returnObj = Polygon.fromSANDS(json)
    }
    if (json['@type'] === 'tmp/line') {
      returnObj = Line.fromSANDS(json)
    }
    if (json['@type'] === 'https://openminds.ebrains.eu/sands/CoordinatePoint') {
      returnObj = Point.fromSANDS(json)
    }
    if (json['@type'] === 'siibra-ex/annotation/point') {
      returnObj = Point.fromJSON(json)
    }
    if (json['@type'] === 'siibra-ex/annotation/line') {
      returnObj = Line.fromJSON(json)
    }
    if (json['@type'] === 'siibra-ex/annotation/polyline') {
      returnObj = Polygon.fromJSON(json)
    }
    if (json['@type'] === DESC_TYPE) {
      const { id, name, desc } = json
      this.metadataMap.set(id, { id, name, desc })
      return
    } else {
      const metadata = this.metadataMap.get(returnObj.id)
      if (returnObj && metadata) {
        returnObj.name = metadata?.name || null
        returnObj.desc = metadata?.desc || null
        this.metadataMap.delete(returnObj.id)
      }
    }
    if (returnObj) return returnObj
    throw new Error(`cannot parse annotation object`)
  }

  ngOnDestroy(){
    while(this.subscription.length > 0) this.subscription.pop().unsubscribe()
  }

  focus$ = new Subject()

  /**
   * @description focus annotation elements
   * @TODO implement me
   */
  public focus(){
    console.error(`todo implement me`)
    this.focus$.next(null)
  }

  /**
   * @deprecated
   * @param mode 
   * @returns 
   */
  async switchAnnotationMode(mode: 'on' | 'off' | 'toggle' = 'toggle') {
    const currMode = await this.store.pipe(
      select(atlasSelection.selectors.viewerMode),
      take(1)
    ).toPromise()

    let payload: 'annotating' = null
    if (mode === 'on') payload = ARIA_LABELS.VIEWER_MODE_ANNOTATING
    if (mode === 'off') {
      if (currMode === ARIA_LABELS.VIEWER_MODE_ANNOTATING) payload = null
      else return
    }
    if (mode === 'toggle') {
      payload = currMode === ARIA_LABELS.VIEWER_MODE_ANNOTATING
        ? null
        : ARIA_LABELS.VIEWER_MODE_ANNOTATING
    }
    this.store.dispatch(
      actions.setViewerMode({
        viewerMode: payload
      })
    )
  }

  /**
   * @param {string} name name of the tool
   */
  async getTool(name: string /* t: Type<IAnnotationGeometry> */) {
    const tools = await this.annotationTools$.pipe(
      take(1)
    ).toPromise()
    for (const _ of tools){
      const { name: _name } = _
      if (name === _name) {
        return _
      }
    }
    return null
  }

  setVisible(flag: boolean){
    this.#annotationLayerVisible = flag
    if (!this.annotationLayer) {
      return
    }
    this.annotationLayer.setVisible(flag)
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
