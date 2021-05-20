import {Component, HostListener, Inject, OnDestroy, OnInit, Optional} from "@angular/core";
import {select, Store} from "@ngrx/store";
import {ARIA_LABELS, CONST} from "common/constants";
import {Observable, Subscription} from "rxjs";
import {getUuid} from "src/util/fn";
import {VIEWER_INJECTION_TOKEN} from "src/ui/layerbrowser/layerDetail/layerDetail.component";
import {buffer, debounceTime, distinctUntilChanged, filter, map, switchMapTo, take, takeUntil, tap} from "rxjs/operators";
import {
  viewerStateNavigationStateSelector,
  viewerStateSelectedTemplateSelector,
  viewerStateViewerModeSelector
} from "src/services/state/viewerState/selectors";
import {AnnotationService} from "src/atlasComponents/userAnnotations/annotationService.service";

@Component({
  selector: 'annotating-mode',
  templateUrl: './annotationMode.template.html',
  styleUrls: ['./annotationMode.style.css']
})
export class AnnotationMode implements OnInit, OnDestroy {

    public selectedType = 0

    public position1: string
    public position2: string
    public editingAnnotationId: string

    public selecting = 'position1'
    public mousePos
    public navState: any

    private hoverAnnotation$: Observable<{id: string, partIndex: number}>
    public hoverAnnotation: {id: string, partIndex: number}
    private onDestroyCb: Function[] = []
    public subscriptions: Subscription[] = []

    private get viewer(){
      return this.injectedViewer || (window as any).viewer
    }

    get nehubaViewer() {
      return (window as any).nehubaViewer
    }
    get interactiveViewer() {
      return (window as any).interactiveViewer
    }

    constructor(
        private store$: Store<any>,
        public ans: AnnotationService,
        @Optional() @Inject(VIEWER_INJECTION_TOKEN) private injectedViewer,
    ) {}

    ngOnInit(): void {
      // Load annotation layer on init
      this.ans.loadAnnotationLayer()

      this.hoverAnnotation$ = new Observable<{id: string, partIndex: number}>(obs => {
        const mouseState = this.viewer.mouseState
        const cb: () => void = mouseState.changed.add(() => {
          if (mouseState.active && mouseState.pickedAnnotationLayer === this.ans.addedLayer.layer.annotationLayerState.value) {
            obs.next({
              id: mouseState.pickedAnnotationId,
              partIndex: mouseState.pickedOffset
            })
          } else {
            obs.next(null)
          }
        })
        this.onDestroyCb.push(() => {
          cb()
          obs.complete()
        })
      }).pipe(
        distinctUntilChanged((o, n) => {
          if (o === n) return true
          return `${o?.id || ''}${o?.partIndex || ''}` === `${n?.id || ''}${n?.partIndex || ''}`
        })
      )

      this.subscriptions.push(this.hoverAnnotation$.subscribe(ha => {
        this.hoverAnnotation = ha
      }))

      const mouseDown$ = this.interactiveViewer.viewerHandle.mouseEvent.pipe(
        filter((e: any) => e.eventName === 'mousedown')
      )
      const mouseUp$ = this.interactiveViewer.viewerHandle.mouseEvent.pipe(
        filter((e: any) => e.eventName === 'mouseup')
      )
      const mouseMove$ = this.interactiveViewer.viewerHandle.mouseEvent.pipe(
        filter((e: any) => e.eventName === 'mousemove')
      )

      // Trigger mouse click on viewer (avoid dragging)
      this.subscriptions.push(
        mouseDown$.pipe(
          switchMapTo(
            mouseUp$.pipe(
              takeUntil(mouseMove$),
            ),
          ),
        ).subscribe(event => {
          if (event.event.button === 2) {
            if (this.selecting === 'position2' && this.mousePos) {
              this.ans.removeAnnotation(this.editingAnnotationId)
              this.editingAnnotationId = null
              this.selecting = 'position1'
            }
          } else {
            this.mouseClick()
          }
        })
      )

      // Dragging - edit hovering annotations while dragging
      let hovering: any
      let hoveringType: string
      let hoveringName: string
      let hoveringPosition1: []
      let hoveringPosition2: []
      let draggingStartPosition: []
      let hoveringPolygonAnnotations: any[]
      let dragging = false
      this.subscriptions.push(
        mouseDown$.pipe(
          tap(() => {
            hovering = this.hoverAnnotation
            if (hovering) {
              draggingStartPosition = this.mousePos
              const hoveringAnnotation = this.ans.annotations.find(a => a.id === this.hoverAnnotation.id)
              if (hoveringAnnotation) {
                hoveringPosition1 = hoveringAnnotation.position1.split(',')
                hoveringPosition2 = hoveringAnnotation.position2 ? hoveringAnnotation.position2.split(',') : null
                hoveringType = this.ans.annotations.find(a => a.id === hovering.id)?.type
                if (hoveringAnnotation.type === 'polygon') {
                  hoveringPolygonAnnotations = this.ans.annotations.filter(a => a.id.split('_')[0] === hovering.id.split('_')[0])
                }
                hoveringType = this.ans.annotations.find(a => a.id === hovering.id)?.type
                hoveringName = this.ans.annotations.find(a => a.id === hovering.id)?.name
              }
            }
          }),
          switchMapTo(
            mouseMove$.pipe(
              takeUntil(mouseUp$.pipe(tap(() => {
                if (dragging) {
                  this.ans.storeBackup()
                  dragging = false
                }
              })
              )),
            ),
          ),
        ).subscribe(event => {
          if (hovering && this.selecting !== 'position2') {
            dragging = true
            // keep navigation while dragging
            this.interactiveViewer.viewerHandle.setNavigationLoc(this.navState)
            // make changes to annotations by type
            //  - when line is hovered move full annotation -
            //  - when line point is hovered move only point
            if (this.mousePos) {
              const dragRange = this.mousePos.map((mp, i) => mp - +draggingStartPosition[i])

              if (hoveringType === 'point') {
                this.ans.saveAnnotation({id: hovering.id, position1: this.mousePos.join(), name: hoveringName, type: hoveringType}, false, true)
              } else if (hoveringType === 'line') {
                if (hovering.partIndex === 0) {

                  this.ans.saveAnnotation({id: hovering.id,
                    position1: hoveringPosition1.map((hp, i) => +hp + dragRange[i]).join(),
                    position2: hoveringPosition2.map((hp, i) => +hp + dragRange[i]).join(),
                    name: hoveringName,
                    type: hoveringType}, false, true)
                } else if (hovering.partIndex === 1) {
                  this.ans.saveAnnotation({id: hovering.id,
                    position1: this.mousePos.join(),
                    position2: hoveringPosition2.join(),
                    name: hoveringName,
                    type: hoveringType}, false, true)
                } else if (hovering.partIndex === 2) {
                  this.ans.saveAnnotation({id: hovering.id,
                    position1: hoveringPosition1.join(),
                    position2: this.mousePos.join(),
                    name: hoveringName,
                    type: hoveringType}, false, true)
                }
              } else if (hoveringType === 'bounding box') {
                this.ans.saveAnnotation({id: hovering.id,
                  position1: hoveringPosition1.map((hp, i) => +hp + dragRange[i]).join(),
                  position2: hoveringPosition2.map((hp, i) => +hp + dragRange[i]).join(),
                  name: hoveringName,
                  type: hoveringType}, false, true)
              } else if (hoveringType === 'ellipsoid') {
                this.ans.saveAnnotation({id: hovering.id,
                  position1: hoveringPosition1.map((hp, i) => +hp + dragRange[i]).join(),
                  position2: hoveringPosition2.join(),
                  name: hoveringName,
                  type: hoveringType}, false, true)
              } else if (hoveringType === 'polygon') {
                if (hovering.partIndex === 0) {
                  hoveringPolygonAnnotations.forEach(pa => {
                    this.ans.saveAnnotation({
                      id: pa.id,
                      position1: pa.position1.split(',').map((hp, i) => +hp + dragRange[i]).join(),
                      position2: pa.position2.split(',').map((hp, i) => +hp + dragRange[i]).join(),
                      name: hoveringName,
                      type: pa.type
                    }, false, true)
                  })
                } else {
                  let samePos1: any[]
                  let samePos2: any[]
                  if (hovering.partIndex === 2) {
                    samePos1 = hoveringPolygonAnnotations.filter(hp => hp.id !== hovering.id && hp.position1 === hoveringPosition2.join())
                    samePos2 = hoveringPolygonAnnotations.filter(hp => hp.id !== hovering.id && hp.position2 === hoveringPosition2.join())
                    this.ans.saveAnnotation({id: hovering.id,
                      position1: hoveringPosition1.join(),
                      position2: this.mousePos.join(),
                      name: hoveringName,
                      type: hoveringType}, false, true)
                  } else if (hovering.partIndex === 1) {
                    samePos1 = hoveringPolygonAnnotations.filter(hp => hp.id !== hovering.id && hp.position1 === hoveringPosition1.join())
                    samePos2 = hoveringPolygonAnnotations.filter(hp => hp.id !== hovering.id && hp.position2 === hoveringPosition1.join())
                    this.ans.saveAnnotation({id: hovering.id,
                      position1: this.mousePos.join(),
                      position2: hoveringPosition2.join(),
                      name: hoveringName,
                      type: hoveringType}, false, true)

                  }
                  samePos1.forEach(a => {
                    this.ans.saveAnnotation({id: a.id,
                      position1: this.mousePos.join(),
                      position2: a.position2,
                      name: hoveringName,
                      type: a.type}, false, true)
                  })

                  samePos2.forEach(a => {
                    this.ans.saveAnnotation({id: a.id,
                      position1: a.position1,
                      position2: this.mousePos.join(),
                      name: hoveringName,
                      type: a.type}, false, true)
                  })
                }
              }
            }
          }

        })
      )

      this.subscriptions.push(
        this.nehubaViewer.mousePosition.inVoxels
          .subscribe(floatArr => {
            this.mousePos = floatArr && floatArr

            if (this.selecting === 'position1' && this.mousePos) {
              this.position1 = this.mousePos.join()
            } else if (this.selecting === 'position2' && this.mousePos) {
              if (this.ans.annotationTypes[this.selectedType].name === 'Ellipsoid') {
                this.position2 = [
                  this.ans.getRadii(this.position1.split(','), this.mousePos),
                ].join()
              } else {
                this.position2 = this.mousePos.join()
              }

              if (this.position1
                            && (this.ans.annotationTypes[this.selectedType].type === 'doubleCoordinate'
                                || this.ans.annotationTypes[this.selectedType].type === 'polygon')
                            && this.position2) {
                if (!this.editingAnnotationId) {
                  this.editingAnnotationId = getUuid()
                  if (this.ans.annotationTypes[this.selectedType].type === 'polygon') {
                    this.editingAnnotationId += '_0'
                  }
                }
                this.ans.saveAnnotation({id: this.editingAnnotationId, position1: this.position1,
                  position2: this.position2,
                  type: this.ans.annotationTypes[this.selectedType].name}, false)
              }
            }
          }),

        // Double click - end creating polygon
        mouseUp$.pipe(
          buffer(mouseUp$.pipe(debounceTime(250))),
          map((list: any) => list.length),
          filter(x => x === 2)
        ).subscribe(() => {

          if (this.ans.annotationTypes[this.selectedType].type === 'polygon') {
            // this.ans.removeAnnotation(this.editingAnnotationId)
            this.ans.saveEditList = this.ans.saveEditList.filter(se => se.id !== this.editingAnnotationId)
            this.ans.removeAnnotationFromViewer(this.editingAnnotationId)

            const annIdObj = this.editingAnnotationId.split('_')
            const prevAnnotation = this.ans.saveEditList.find(a => a.id === `${annIdObj[0]}_${+annIdObj[1] - 1}`)
            if (prevAnnotation && prevAnnotation.id) {
              this.ans.saveEditList = this.ans.saveEditList.filter(se => se.id !== prevAnnotation.id)
              this.ans.removeAnnotationFromViewer(prevAnnotation.id)
            }

            this.ans.storeBackup()

            this.editingAnnotationId = null
            this.selecting = 'position1'
          }
        }),

        this.store$.pipe(
          select(viewerStateNavigationStateSelector),
        ).subscribe(nav => {
          this.navState = nav.position
        }),
        this.store$.pipe(
          select(viewerStateSelectedTemplateSelector),
          take(1)
        ).subscribe(tmpl => {
          this.ans.selectedTemplate = tmpl.name
          this.ans.darkTheme = tmpl.useTheme === 'dark'

          // Set get annotations from the local storage and add them to the viewer
          if (window.localStorage.getItem(CONST.USER_ANNOTATION_STORE_KEY) && window.localStorage.getItem(CONST.USER_ANNOTATION_STORE_KEY).length) {
            const annotationsString = window.localStorage.getItem(CONST.USER_ANNOTATION_STORE_KEY)
            this.ans.annotations = JSON.parse(annotationsString)
            this.ans.displayAnnotations = this.ans.annotations.filter(a => a.type !== 'polygon')
            this.ans.addPolygonsToDisplayAnnotations(this.ans.annotations.filter(a => a.type === 'polygon'))
            this.ans.annotations.filter(a => a.annotationVisible && a.templateName === this.ans.selectedTemplate)
              .forEach(a => {
                this.ans.addAnnotationOnViewer(a)
              })
          }
        })
      )

    }

    ngOnDestroy(): void {
      while (this.onDestroyCb.length > 0) this.onDestroyCb.pop()()
      this.subscriptions.forEach(s => s.unsubscribe())
      if (this.ans.addedLayer) {
        this.viewer.layerManager.removeManagedLayer(this.ans.addedLayer)
      }
    }

    @HostListener('document:keydown.escape', ['$event']) onKeydownHandler(event: KeyboardEvent) {
      if (this.selecting === 'position2' && this.mousePos) {
        this.ans.removeAnnotation(this.editingAnnotationId)
        this.ans.storeBackup()
        this.editingAnnotationId = null
        this.selecting = 'position1'
      }
    }

    @HostListener('contextmenu', ['$event'])
    onClickListener(ev: MouseEvent){
      if (this.selecting === 'position2' && this.mousePos) {
        this.ans.removeAnnotation(this.editingAnnotationId)
        this.editingAnnotationId = null
        this.selecting = 'position1'
      }
    }


    mouseClick() {
      // Remove annotation
      if (this.ans.annotationTypes[this.selectedType].type === 'remove' && this.hoverAnnotation) {
        const hoveringAnnotationObj = this.ans.annotations.find(a => a.id === this.hoverAnnotation.id)
        if (hoveringAnnotationObj.type === 'polygon') {
          const polygonAnnotations = this.ans.annotations.filter(a => a.id.split('_')[0] === hoveringAnnotationObj.id.split('_')[0])
          polygonAnnotations.forEach(pa => this.ans.removeAnnotation(pa.id))
        } else {
          this.ans.removeAnnotation(this.hoverAnnotation.id)
        }
      }
      // save annotation by selected annotation type
      if (this.selecting === 'position1' && this.position1) {
        if (this.ans.annotationTypes[this.selectedType].type === 'singleCoordinate') {
          this.ans.saveAnnotation({position1: this.position1,
            position2: this.position2,
            type: this.ans.annotationTypes[this.selectedType].name})
        } else if (this.ans.annotationTypes[this.selectedType].type === 'doubleCoordinate'
                        || this.ans.annotationTypes[this.selectedType].type === 'polygon') {
          this.selecting = 'position2'
        }

      } else if (this.selecting === 'position2' && this.position2 && this.mousePos) {
        if (this.ans.annotationTypes[this.selectedType].type === 'polygon') {
          this.ans.saveAnnotation({id: this.editingAnnotationId,
            position1: this.position1,
            position2: this.position2,
            type: this.ans.annotationTypes[this.selectedType].name}, false, true)
          this.position1 = this.position2
          const splitEditingAnnotationId = this.editingAnnotationId.split('_')
          this.editingAnnotationId = splitEditingAnnotationId[0] + '_' + (+splitEditingAnnotationId[1]+1)
        } else {
          this.ans.saveAnnotation({id: this.editingAnnotationId,
            position1: this.position1,
            position2: this.position2,
            type: this.ans.annotationTypes[this.selectedType].name})
          this.editingAnnotationId = null
          this.selecting = 'position1'
        }

      }
    }

    public selectAnnotationType = (typeIndex) => {
      this.selectedType = typeIndex
      this.editingAnnotationId = null
      this.mousePos = null
      this.position2 = null
      this.position1 = null
      this.selecting = 'position1'
    }

}
