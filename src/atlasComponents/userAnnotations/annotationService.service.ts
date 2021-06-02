import {Inject, Injectable, Optional} from "@angular/core";
import {CONST} from "common/constants";
import {viewerStateSetViewerMode} from "src/services/state/viewerState/actions";
import {getUuid} from "src/util/fn";
import {Store} from "@ngrx/store";
import {VIEWER_INJECTION_TOKEN} from "src/ui/layerbrowser/layerDetail/layerDetail.component";

const USER_ANNOTATION_LAYER_SPEC = {
  "type": "annotation",
  "tool": "annotateBoundingBox",
  "name": CONST.USER_ANNOTATION_LAYER_NAME,
  "annotationColor": "#ffee00",
  "annotations": [],
}

@Injectable()
export class AnnotationService {

    // Annotations to display on viewer
    public pureAnnotationsForViewer = []

    // Grouped annotations for user
    public groupedAnnotations = []

    // Filtered annotations with converted voxed to mm
    public finalAnnotationList = []

    public addedLayer: any
    public ellipsoidMinRadius = 0.5
    public annotationFilter: 'all' | 'current' = 'current'

    public selectedTemplate: {name, id}
    public voxelSize: any[] = []
    public selectedAtlas: {name, id}
    public hoverAnnotation: {id: string, partIndex: number}

    public annotationTypes = [
      {name: 'Cursor', class: 'fas fa-mouse-pointer', type: 'move', action: 'none'},
      {name: 'Point', class: 'fas fa-circle', type: 'singleCoordinate', action: 'paint'},
      {name: 'Line', class: 'fas fa-slash', type: 'doubleCoordinate', action: 'paint'},
      {name: 'Polygon', class: 'fas fa-draw-polygon', type: 'polygon', action: 'paint'},
      // {name: 'Bounding box', class: 'far fa-square', type: 'doubleCoordinate', action: 'paint'},
      // {name: 'Ellipsoid', class: 'fas fa-bullseye', type: 'doubleCoordinate', action: 'paint'},
      {name: 'Remove', class: 'fas fa-trash', type: 'remove', action: 'remove'},
    ]

    private get viewer(){
      return this.injectedViewer || (window as any).viewer
    }

    constructor(private store$: Store<any>,
                @Optional() @Inject(VIEWER_INJECTION_TOKEN) private injectedViewer
    ) {}

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
      position1 = null,
      position2 = null,
      name = null,
      description = null,
      type = null,
      circular = null,
      atlas = null,
      template = null,
    } = {}, store = true, backup = false) {
      let annotation = {
        id: id || getUuid(),
        annotationVisible: true,
        description,
        name,
        position1,
        position2,
        circular,
        template: template || this.selectedTemplate,
        atlas: this.selectedAtlas,
        type: type.toLowerCase()
      }

      const foundIndex = this.pureAnnotationsForViewer.findIndex(x => x.id === annotation.id)

      if (foundIndex >= 0) {
        annotation = {
          ...this.pureAnnotationsForViewer[foundIndex],
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
          this.addPolygonsToGroupedAnnotations(this.saveEditList)
        }
        this.saveEditList.forEach(a => this.storeAnnotation(a))
        this.saveEditList = []
      }
    }

    giveNameByType(type) {
      const pointAnnotationNumber = this.pureAnnotationsForViewer
        .filter(a => a.name && a.name.startsWith(type) && (+a.name.split(type)[1]))
        .map(a => +a.name.split(type)[1])

      return pointAnnotationNumber && pointAnnotationNumber.length?
        `${type}${Math.max(...pointAnnotationNumber) + 1}` : `${type}1`

    }

    storeAnnotation(annotation) {
      // give names by type + number
      if (!annotation.name && annotation.type !== 'polygon') {
        annotation.name = this.giveNameByType(annotation.type)
      }

      const foundIndex = this.pureAnnotationsForViewer.findIndex(x => x.id === annotation.id)

      if (foundIndex >= 0) {
        annotation = {
          ...this.pureAnnotationsForViewer[foundIndex],
          ...annotation
        }
        this.pureAnnotationsForViewer[foundIndex] = annotation
      } else {
        this.pureAnnotationsForViewer.push(annotation)
      }

      if(annotation.type !== 'polygon') {
        const foundIndex = this.groupedAnnotations.findIndex(x => x.id === annotation.id)

        if (foundIndex >= 0) {
          this.groupedAnnotations[foundIndex] = annotation
        } else {
          this.groupedAnnotations.push(annotation)
        }
        this.refreshAnnotationFilter()
      }

      this.storeToLocalStorage()
    }

    addAnnotationOnViewer(annotation) {
      const annotationLayer = this.viewer.layerManager.getLayerByName(CONST.USER_ANNOTATION_LAYER_NAME).layer
      const annotations = annotationLayer.localAnnotations.toJSON()

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
      this.pureAnnotationsForViewer = this.pureAnnotationsForViewer.filter(a => a.id !== id)
      this.groupedAnnotations = this.groupedAnnotations.filter(a => a.id !== id.split('_')[0])
      this.refreshAnnotationFilter()
      this.storeToLocalStorage()
    }

    storeToLocalStorage() {
      window.localStorage.setItem(CONST.USER_ANNOTATION_STORE_KEY, JSON.stringify(this.pureAnnotationsForViewer))
    }

    removeAnnotationFromViewer(id) {
      const annotationLayer = this.viewer.layerManager.getLayerByName(CONST.USER_ANNOTATION_LAYER_NAME)?.layer
      if (annotationLayer) {
        let annotations = annotationLayer.localAnnotations.toJSON()
        annotations = annotations.filter(a => a.id !== id)
        annotationLayer.localAnnotations.restoreState(annotations)
      }
    }

    addPolygonsToGroupedAnnotations(annotations) {
      let transformed = [...annotations]

      for (let i = 0; i<annotations.length; i++) {

        const annotationId = annotations[i].id.split('_')
        if (!transformed.find(t => t.id === annotationId[0])) {
          const polygonAnnotations = annotations.filter(a => a.id.split('_')[0] === annotationId[0]
                && a.id.split('_')[1])

          const polygonPositions = polygonAnnotations.map((a, index) => {
            return (index+1) !== polygonAnnotations.length? {
              position: a.position2,
              lines: [
                {id: a.id, point: 2},
                {id: polygonAnnotations[index+1].id, point: 1}
              ]
            } : a.position2 !== polygonAnnotations[0].position1? {
              position: a.position2,
              lines: [
                {id: a.id, point: 2}
              ]
            } : null
          }).filter(a => !!a)
          polygonPositions.unshift({
            position: polygonAnnotations[0].position1,
            lines: polygonAnnotations[0].position1 === [...polygonAnnotations].pop().position2?
              [{id: polygonAnnotations[0].id, point: 1}, {id: [...polygonAnnotations].pop().id, point: 2}]
              : [{id: polygonAnnotations[0].id, point: 1}]
          })

          transformed = transformed.filter(a => a.id.split('_')[0] !== annotationId[0])

          if (!annotations[i].name) {
            annotations[i].name = this.giveNameByType(annotations[i].type)
          }

          transformed.push({
            id: annotationId[0],
            name: annotations[i].name,
            description: annotations[i].description,
            type: 'polygon',
            annotations: polygonAnnotations,
            positions: polygonPositions,
            circular: polygonAnnotations[0].position1 === [...polygonAnnotations].pop().position2,
            annotationVisible: annotations[i].annotationVisible,
            template: annotations[i].template,
            atlas: this.selectedAtlas
          })
        }

      }

      transformed.forEach(tr=> {
        const foundIndex = this.groupedAnnotations.findIndex(x => x.id === tr.id)

        if (foundIndex >= 0) {
          this.groupedAnnotations[foundIndex] = tr
        } else {
          this.groupedAnnotations.push(tr)
        }
        this.refreshAnnotationFilter()
      })
    }

    refreshAnnotationFilter(filter = null) {
      if (filter) {this.annotationFilter = filter}
      this.finalAnnotationList = this.groupedAnnotations
        // Filter all/current template
        .filter(a => this.annotationFilter === 'all' || a.template.id === this.selectedTemplate.id)
        // convert to MM
        .map(a => {
          if (a.positions) {
            a.positions = a.positions.map(p => {
              return {
                ...p,
                position: this.voxelToMM(p.position.split(',')).join()
              }
            })
          } else {
            a.position1 = this.voxelToMM(a.position1.split(',')).join()
            a.position2 = a.position2 && this.voxelToMM(a.position2.split(',')).join()
          }

          a.dimension = 'mm'
          return a
        })
        // clear polygonAnnotations
        .map(a => {
          if (a.annotations) {
            a.annotations = a.annotations.map(an => {
              return {
                id: an.id,
                position1: an.position1,
                position2: an.position2
              }
            })
          }

          return a
        })
    }

    voxelToMM(r): any[] {
      return r.map((r, i) => parseFloat((+r*this.voxelSize[i]/1e6).toFixed(3)))
    }

    mmToVoxel(mm): any[] {
      return mm.map((m, i) => +m*1e6/this.voxelSize[i])
    }

    getVoxelFromSpace = (spaceId: string) => {
      return IAV_VOXEL_SIZES_NM[spaceId]
    }

}



export const IAV_VOXEL_SIZES_NM = {
  'minds/core/referencespace/v1.0.0/265d32a0-3d84-40a5-926f-bf89f68212b9': [25000, 25000, 25000],
  'minds/core/referencespace/v1.0.0/d5717c4a-0fa1-46e6-918c-b8003069ade8': [39062.5, 39062.5, 39062.5],
  'minds/core/referencespace/v1.0.0/a1655b99-82f1-420f-a3c2-fe80fd4c8588': [21166.666015625, 20000, 21166.666015625],
  'minds/core/referencespace/v1.0.0/7f39f7be-445b-47c0-9791-e971c0b6d992': [1000000, 1000000, 1000000,],
  'minds/core/referencespace/v1.0.0/dafcffc5-4826-4bf1-8ff6-46b8a31ff8e2': [1000000, 1000000, 1000000]
}
