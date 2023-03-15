import { Injectable, OnDestroy, Type } from "@angular/core";
import { ARIA_LABELS } from 'common/constants'
import { Inject, Optional } from "@angular/core";
import { select, Store } from "@ngrx/store";
import { BehaviorSubject, combineLatest, fromEvent, merge, Observable, of, Subject, Subscription } from "rxjs";
import {map, switchMap, filter, shareReplay, pairwise, withLatestFrom } from "rxjs/operators";
import { NehubaViewerUnit } from "src/viewerModule/nehuba";
import { NEHUBA_INSTANCE_INJTKN } from "src/viewerModule/nehuba/util";
import { AbsToolClass, ANNOTATION_EVENT_INJ_TOKEN, IAnnotationEvents, IAnnotationGeometry, INgAnnotationTypes, INJ_ANNOT_TARGET, TAnnotationEvent, ClassInterface, TCallbackFunction, TSands, TGeometryJson, TNgAnnotationLine, TCallback } from "./type";
import { getExportNehuba, switchMapWaitFor } from "src/util/fn";
import { Polygon } from "./poly";
import { Line } from "./line";
import { Point } from "./point";
import { FilterAnnotationsBySpace } from "../filterAnnotationBySpace.pipe";
import { MatSnackBar } from "@angular/material/snack-bar";
import { actions } from "src/state/atlasSelection";
import { atlasSelection } from "src/state";
import { SxplrTemplate } from "src/atlasComponents/sapi/sxplrTypes";
import { AnnotationLayer } from "src/atlasComponents/annotations";
import { translateV3Entities } from "src/atlasComponents/sapi/translateV3";

const LOCAL_STORAGE_KEY = 'userAnnotationKey'

type TAnnotationMetadata = {
  id: string
  name: string
  desc: string
}

const descType = 'siibra-ex/meta/desc' as const
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

  private annotationLayer: AnnotationLayer
  private activeToolName: string
  private forcedAnnotationRefresh$ = new BehaviorSubject(null)

  private selectedTmpl: SxplrTemplate
  private selectedTmpl$ = this.store.pipe(
    select(atlasSelection.selectors.selectedTemplate),
  )
  public moduleAnnotationTypes: {instance: {name: string, iconClass: string, toolSelected$: Observable<boolean>}, onClick: () => void}[] = []
  private managedAnnotationsStream$ = new Subject<{
    tool: string
    annotations: IAnnotationGeometry[]
  }>()

  private managedAnnotations: IAnnotationGeometry[] = []
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
    map(ev => {
      if (!(ev?.detail)) return null
      const { pickedAnnotationId } = ev.detail
      const annId = (pickedAnnotationId || '').split('_')[0]
      const foundAnn = this.managedAnnotations.find(ann => ann.id === annId)
      if (!foundAnn) return null
      return foundAnn
    })
  )

  private registeredTools: {
    name: string
    iconClass: string
    toolInstance: AbsToolClass<any>
    target?: Type<IAnnotationGeometry>
    editCmp?: Type<unknown>
    onDestoryCallBack: () => void
  }[] = []
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
  public registerTool<T extends AbsToolClass<any>>(arg: {
    toolCls: ClassInterface<T>
    target?: ClassInterface<IAnnotationGeometry>
    editCmp?: ClassInterface<any>
  }): AbsToolClass<any>{
    const { toolCls: Cls, target, editCmp } = arg
    const newTool = new Cls(this.annotnEvSubj, arg => this.handleToolCallback(arg)) as T & { ngOnDestroy?: () => void }
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

    this.registeredTools.push({
      name,
      iconClass,
      target,
      editCmp,
      toolInstance: newTool,
      onDestoryCallBack: () => {
        newTool.ngOnDestroy && newTool.ngOnDestroy()
        this.managedAnnotationsStream$.next({
          annotations: [],
          tool: name
        })
        while(toolSubscriptions.length > 0) toolSubscriptions.pop().unsubscribe()
      }
    })

    return newTool
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

  #voxelSize = this.store.pipe(
    select(atlasSelection.selectors.selectedTemplate),
    switchMap(tmpl => translateV3Entities.translateSpaceToVolumeImage(tmpl)),
    map(volImages => {
      if (volImages.length === 0) {
        return null
      }
      const volImage = volImages[0]
      const { real, voxel } = volImage.info
      return [0, 1, 2].map(idx => real[idx]/voxel[idx]) as [number, number, number]
    })
  )

  constructor(
    private store: Store<any>,
    private snackbar: MatSnackBar,
    @Inject(INJ_ANNOT_TARGET) annotTarget$: Observable<HTMLElement>,
    @Inject(ANNOTATION_EVENT_INJ_TOKEN) private annotnEvSubj: Subject<TAnnotationEvent<keyof IAnnotationEvents>>,
    @Optional() @Inject(NEHUBA_INSTANCE_INJTKN) nehubaViewer$: Observable<NehubaViewerUnit>,
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
      })
    )

    /**
     * on new nehubaViewer, unset annotationLayer
     */
    this.subscription.push(
      nehubaViewer$.subscribe(() => {
        this.annotationLayer = null
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
      map(([_, annts]) => {
        const out = []
        for (const ann of annts) {
          out.push(...ann.toNgAnnotation())
        }
        return out
      }),
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
    this.subscription.push(
      store.pipe(
        select(atlasSelection.selectors.viewerMode),
        withLatestFrom(this.#voxelSize),
      ).subscribe(([viewerMode, voxelSize]) => {
        this.currMode = viewerMode
        if (viewerMode === ModularUserAnnotationToolService.VIEWER_MODE) {
          if (this.annotationLayer) this.annotationLayer.setVisible(true)
          else {
            if (!voxelSize) throw new Error(`voxelSize of ${this.selectedTmpl.id} cannot be found!`)
            if (this.annotationLayer) {
              this.annotationLayer.dispose()
            }
            this.annotationLayer = new AnnotationLayer(
              ModularUserAnnotationToolService.ANNOTATION_LAYER_NAME,
              ModularUserAnnotationToolService.USER_ANNOTATION_LAYER_SPEC.annotationColor
            )
            this.annotationLayer.onHover.subscribe(val => {
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
            /**
             * on template changes, the layer gets lost
             * force redraw annotations if layer needs to be recreated
             */
            this.forcedAnnotationRefresh$.next(null)
          }
        } else {
          if (this.annotationLayer) this.annotationLayer.setVisible(false)
        }
      })
    )

    /**
     * on template select, update selectedtmpl
     * required for metadata in annotation geometry and voxel size
     */
    this.subscription.push(
      this.selectedTmpl$.subscribe(tmpl => {
        this.selectedTmpl = tmpl
        this.annotnEvSubj.next({
          type: 'metadataEv',
          detail: {
            space: tmpl
          }
        })
        this.forcedAnnotationRefresh$.next(null)
      }),
      this.managedAnnotations$.subscribe(ann => {
        this.managedAnnotations = ann
      }),
    )

    /**
     * on window unload, save annotation
     */

    /**
     * before unload, save annotations
     */
    window.addEventListener('beforeunload', () => {
      this.storeAnnotation(this.managedAnnotations)
    })
  }

  /**
   * ensure that loadStoredAnnotation only gets called once
   */
  private loadFlag = false
  public async loadStoredAnnotations(){
    if (this.loadFlag) return
    this.loadFlag = true
    
    const encoded = window.localStorage.getItem(LOCAL_STORAGE_KEY)
    if (!encoded) return []
    const bin = atob(encoded)
    
    const { pako } = await getExportNehuba()
    const decoded = pako.inflate(bin, { to: 'string' })
    const arr = JSON.parse(decoded)
    const anns: IAnnotationGeometry[] = []
    for (const obj of arr) {
      const geometry = this.parseAnnotationObject(obj)
      if (geometry) anns.push(geometry)
    }
    
    for (const ann of anns) {
      this.importAnnotation(ann)
    }
  }

  public exportAnnotationMetadata(ann: IAnnotationGeometry): TAnnotationMetadata & { '@type': 'siibra-ex/meta/desc' } {
    return {
      '@type': descType,
      id: ann.id,
      name: ann.name,
      desc: ann.desc,
    }
  }

  /**
   * stop gap measure when exporting/import annotations in sands format
   * metadata (name/desc) will be saved in a separate metadata file
   */
  private metadataMap = new Map<string, TAnnotationMetadata>()

  private async storeAnnotation(anns: IAnnotationGeometry[]){
    const arr = []
    for (const ann of anns) {
      const json = ann.toJSON()
      arr.push(json)
    }
    const stringifiedJSON = JSON.stringify(arr)
    const exportNehuba = await getExportNehuba()
    if (!exportNehuba) return
    const { pako } = exportNehuba
    const compressed = pako.deflate(stringifiedJSON)
    let out = ''
    for (const num of compressed) {
      out += String.fromCharCode(num)
    }
    const encoded = btoa(out)
    window.localStorage.setItem(LOCAL_STORAGE_KEY, encoded)
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

  public getEditAnnotationCmp(annotation: IAnnotationGeometry): Type<unknown>{
    const foundTool = this.registeredTools.find(t => t.target && annotation instanceof t.target)
    return foundTool && foundTool.editCmp
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
    if (json['@type'] === descType) {
      const existingAnn = this.managedAnnotations.find(ann => json.id === ann.id)
      if (existingAnn) {

        // potentially overwriting existing name and desc...
        // maybe should show warning?
        existingAnn.name = json.name
        existingAnn.desc = json.desc
        return existingAnn
      } else {
        const { id, name, desc } = json
        this.metadataMap.set(id, { id, name, desc })
        return
      }
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

  importAnnotation(annotationObj: IAnnotationGeometry){
    for (const tool of this.registeredTools) {
      const { toolInstance, target } = tool
      if (!!target && annotationObj instanceof target) {
        toolInstance.addAnnotation(annotationObj)
        return
      }
    }
  }

  ngOnDestroy(){
    while(this.subscription.length > 0) this.subscription.pop().unsubscribe()
  }

  private currMode: string
  switchAnnotationMode(mode: 'on' | 'off' | 'toggle' = 'toggle') {

    let payload: 'annotating' = null
    if (mode === 'on') payload = ARIA_LABELS.VIEWER_MODE_ANNOTATING
    if (mode === 'off') {
      if (this.currMode === ARIA_LABELS.VIEWER_MODE_ANNOTATING) payload = null
      else return
    }
    if (mode === 'toggle') {
      payload = this.currMode === ARIA_LABELS.VIEWER_MODE_ANNOTATING
        ? null
        : ARIA_LABELS.VIEWER_MODE_ANNOTATING
    }
    this.store.dispatch(
      actions.setViewerMode({
        viewerMode: payload
      })
    )
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
