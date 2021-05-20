import {ApplicationRef, ChangeDetectorRef, Inject, Injectable, OnDestroy, Optional} from "@angular/core";
import {CONST} from "common/constants";
import {viewerStateSetViewerMode} from "src/services/state/viewerState/actions";
import {Subscription} from "rxjs";
import {getUuid} from "src/util/fn";
import {Store} from "@ngrx/store";
import {VIEWER_INJECTION_TOKEN} from "src/ui/layerbrowser/layerDetail/layerDetail.component";
import {TemplateCoordinatesTransformation} from "src/services/templateCoordinatesTransformation.service";

const USER_ANNOTATION_LAYER_SPEC = {
  "type": "annotation",
  "tool": "annotateBoundingBox",
  "name": CONST.USER_ANNOTATION_LAYER_NAME,
  "annotationColor": "#ffee00",
  "annotations": [],
}

@Injectable()
export class AnnotationService implements OnDestroy {

    public annotations = []
    public displayAnnotations = []
    public addedLayer: any
    public ellipsoidMinRadius = 0.5
    public annotationFilter: 'all' | 'current' = 'current'

    public selectedTemplate: string
    public darkTheme = false
    public subscriptions: Subscription[] = []

    public annotationTypes = [
      {name: 'Cursor', class: 'fas fa-mouse-pointer', type: 'move'},
      {name: 'Point', class: 'fas fa-circle', type: 'singleCoordinate'},
      {name: 'Line', class: 'fas fa-slash', type: 'doubleCoordinate'},
      {name: 'Polygon', class: 'fas fa-draw-polygon', type: 'polygon'},
      // {name: 'Bounding box', class: 'far fa-square', type: 'doubleCoordinate'},
      // {name: 'Ellipsoid', class: 'fas fa-bullseye', type: 'doubleCoordinate'},
      {name: 'Remove', class: 'fas fa-trash', type: 'remove'},
    ]

    private get viewer(){
      return this.injectedViewer || (window as any).viewer
    }

    constructor(private store$: Store<any>,
                @Optional() @Inject(VIEWER_INJECTION_TOKEN) private injectedViewer) {}

    public disable = () => {
      this.store$.dispatch(viewerStateSetViewerMode({payload: null}))
    }

    public loadAnnotationLayer() {
      if (!this.viewer) {
        throw new Error(`viewer is not initialised`)
      }

      const layer = this.viewer.layerSpecification.getLayer(
        CONST.USER_ANNOTATION_LAYER_NAME,
        USER_ANNOTATION_LAYER_SPEC
      )

      this.addedLayer = this.viewer.layerManager.addManagedLayer(layer)


    }

    getRadii(a, b) {
      const returnArray = [Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]), Math.abs(b[2] - a[2])]
        .map(n => n === 0? this.ellipsoidMinRadius : n)
      return returnArray
    }

    saveAnnotation({id = null,
      position1 = null, //this.position1,
      position2 = null, //this.position2,
      type = null, //this.annotationTypes[this.selectedType].name,
      description = null,
      name = null,
      templateName = null,
    } = {}, store = true, backup = false) {
      let annotation = {
        id: id || getUuid(),
        annotationVisible: true,
        description,
        name,
        position1,
        position2,
        templateName: templateName || this.selectedTemplate,
        type: type.toLowerCase()
      }

      const foundIndex = this.annotations.findIndex(x => x.id === annotation.id)

      if (foundIndex >= 0) {
        annotation = {
          ...this.annotations[foundIndex],
          ...annotation
        }
      }

      this.addAnnotationOnViewer(annotation)

      if (backup) {
        const i = this.saveEditList.findIndex((e) => e.id === annotation.id)
        if (i < 0) {this.saveEditList.push(annotation)
        } else {this.saveEditList[i] = annotation}
      }

      if (store) {
        this.storeAnnotation(annotation)
      }
    }
    public saveEditList = []

    public storeBackup() {
      if (this.saveEditList.length) {
        if (this.saveEditList[0].type === 'polygon') {
          this.addPolygonsToDisplayAnnotations(this.saveEditList)
        }
        this.saveEditList.forEach(a => this.storeAnnotation(a))
        this.saveEditList = []
      }
    }

    storeAnnotation(annotation) {
      // give names by type + number
      if (!annotation.name) {
        const pointAnnotationNumber = this.annotations
          .filter(a => a.name && a.name.startsWith(annotation.type) && (+a.name.split(annotation.type)[1]))
          .map(a => +a.name.split(annotation.type)[1])

        if (pointAnnotationNumber && pointAnnotationNumber.length) {
          annotation.name = `${annotation.type}${Math.max(...pointAnnotationNumber) + 1}`
        } else {
          annotation.name  = `${annotation.type}1`
        }
      }

      const foundIndex = this.annotations.findIndex(x => x.id === annotation.id)

      if (foundIndex >= 0) {
        annotation = {
          ...this.annotations[foundIndex],
          ...annotation
        }
        this.annotations[foundIndex] = annotation
      } else {
        this.annotations.push(annotation)
      }

      if(annotation.type !== 'polygon') {
        const foundIndex = this.displayAnnotations.findIndex(x => x.id === annotation.id)

        if (foundIndex >= 0) {
          this.displayAnnotations[foundIndex] = annotation
        } else {
          this.displayAnnotations.push(annotation)
        }
      }

      this.storeToLocalStorage()
    }

    addAnnotationOnViewer(annotation) {
      const annotationLayer = this.viewer.layerManager.getLayerByName(CONST.USER_ANNOTATION_LAYER_NAME).layer
      const annotations = annotationLayer.localAnnotations.toJSON()

      // ToDo Still some error with the logic
      // const position1Voxel = this.annotationForm.controls.position1.value.split(',')
      //   .map((r, i) => r/this.voxelSize[i])
      // const position2Voxel = this.annotationForm.controls.position2.value.split(',')
      //   .map((r, i) => r/this.voxelSize[i])

      const position1Voxel = annotation.position1.split(',')
      const position2Voxel = annotation.position2? annotation.position2.split(',') : ''

      annotations.push({
        description: annotation.description? annotation.description : '',
        id: annotation.id,
        point: annotation.type === 'point'? annotation.position1.split(',') : null,
        pointA: annotation.type === 'line' || annotation.type === 'bounding box' || annotation.type === 'polygon'?
          position1Voxel : null,
        pointB: annotation.type === 'line' || annotation.type === 'bounding box' || annotation.type === 'polygon'?
          position2Voxel : null,
        center: annotation.type === 'ellipsoid'?
          position1Voxel : null,
        radii: annotation.type === 'ellipsoid'?
          position2Voxel : null,
        type: annotation.type === 'bounding box'?  'axis_aligned_bounding_box'
          : annotation.type === 'polygon'? 'line'
            : annotation.type.toUpperCase()
      })

      annotationLayer.localAnnotations.restoreState(annotations)
    }


    removeAnnotation(id) {
      this.removeAnnotationFromViewer(id)
      this.annotations = this.annotations.filter(a => a.id !== id)
      this.storeToLocalStorage()
    }

    storeToLocalStorage() {
      // ToDo temporary solution - because impure pipe stucks


      window.localStorage.setItem(CONST.USER_ANNOTATION_STORE_KEY, JSON.stringify(this.annotations))
    }

    removeAnnotationFromViewer(id) {
      const annotationLayer = this.viewer.layerManager.getLayerByName(CONST.USER_ANNOTATION_LAYER_NAME)?.layer
      if (annotationLayer) {
        let annotations = annotationLayer.localAnnotations.toJSON()
        annotations = annotations.filter(a => a.id !== id)
        annotationLayer.localAnnotations.restoreState(annotations)
      }
    }

    addPolygonsToDisplayAnnotations(annotations) {
      let transformed = [...annotations]

      for (let i = 0; i<annotations.length; i++) {

        const annotationId = annotations[i].id.split('_')
        if (!transformed.find(t => t.id === annotationId[0])) {
          const polygonAnnotations = annotations.filter(a => a.id.split('_')[0] === annotationId[0]
                && a.id.split('_')[1])

          const polygonPositions = polygonAnnotations.map((a, i) => {
            return i+1 !== polygonAnnotations.length? {
              position: a.position2,
              lines: [
                {id: a.id, point: 2},
                {id: polygonAnnotations[i+1], point: 1}
              ]
            } : polygonAnnotations[i].position2 !== polygonAnnotations[0].position1? {
              position: a.position2,
              lines: [
                {id: a.id, point: 2}
              ]
            } : {
              position: a.position2,
              lines: [
                {id: a.id, point: 2},
                {id: polygonAnnotations[0].id, point: 1}
              ]
            }
          })

          transformed = transformed.filter(a => a.id.split('_')[0] !== annotationId[0])

          transformed.push({
            id: annotationId[0],
            name: annotations[i].name,
            type: 'polygon',
            annotations: polygonAnnotations,
            positions: polygonPositions,
            annotationVisible: annotations[i].annotationVisible,
            templateName: annotations[i].templateName
          })
        }

      }

      this.displayAnnotations = [
        ...this.displayAnnotations,
        ...transformed
      ]
    }

    changeAnnotationFilter(filter) {
      this.annotationFilter = filter
      this.displayAnnotations = this.displayAnnotations
        .filter(a => this.annotationFilter === 'all' || a.templateName === this.selectedTemplate)
    }

    ngOnDestroy(){
      this.subscriptions.forEach(s => s.unsubscribe())
    }
}
