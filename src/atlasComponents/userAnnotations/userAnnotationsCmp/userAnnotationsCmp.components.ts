import { Component, EventEmitter, Inject, OnDestroy, OnInit, Optional, Output} from "@angular/core";
import { Observable, Subscription } from "rxjs";
import { NEHUBA_INSTANCE_INJTKN } from "src/viewerModule/nehuba/util";
import { getUuid } from 'src/util/fn'

const USER_ANNOTATION_LAYER_NAME = 'USER_ANNOTATION_LAYER_NAME'
const USER_ANNOTATION_STORE_KEY = `user_landmarks_demo_1`

@Component({
  selector: 'user-annotations',
  templateUrl: './userAnnotationsCmp.template.html',
  styleUrls: ['./userAnnotationsCmp.style.css']
})
export class UserAnnotationsComponent implements OnInit, OnDestroy {

  public landmarkFilter: 'all' | 'current' = 'all'
  public cursorOut = false
  public selecting: string
  public editingMode = false
  public minimized = false

  public hovering = -1
  public expanded = -1

  public annotations = []

  @Output() close: EventEmitter<any> = new EventEmitter()

  private subscription: Subscription[] = []
  constructor(
    @Optional() @Inject(NEHUBA_INSTANCE_INJTKN) nehuba$: Observable<any>
  ) {
    if (nehuba$) {
      this.subscription.push(
        nehuba$.subscribe(v => this.viewer = v)
      )
    }
  }

  private viewer: any

  ngOnDestroy(): void {
    const annotationLayer = this.viewer.layerManager.getLayerByName(USER_ANNOTATION_LAYER_NAME)
    if (annotationLayer) {
      this.viewer?.layerManager.removeManagedLayer(
          this.viewer.layerManager.getLayerByName(USER_ANNOTATION_LAYER_NAME))
    }
  }

  ngOnInit(): void {
    this.loadAnnotationLayer()

    if (window.localStorage.getItem(USER_ANNOTATION_STORE_KEY) && window.localStorage.getItem(USER_ANNOTATION_STORE_KEY).length) {
      const annotationsString = window.localStorage.getItem(USER_ANNOTATION_STORE_KEY)
      this.annotations = JSON.parse(annotationsString)
      this.annotations.filter(a => a.annotationVisible).forEach(a => this.addAnnotationOnViewer(a))
    }
  }

  public loadAnnotationLayer() {
    return Object.keys(this.annotationLayerObj)
      .filter(key =>
      /* if the layer exists, it will not be loaded */
        !this.viewer?.layerManager.getLayerByName(key))
      .map(key => {
        this.viewer?.layerManager.addManagedLayer(
          this.viewer.layerSpecification.getLayer(key, this.annotationLayerObj[key]))
        return this.annotationLayerObj[key]
      })
  }

  saveAnnotation(annotation) {
    if (!annotation.id) {
      annotation.id = getUuid()
    }

    const foundIndex = this.annotations.findIndex(x => x.id === annotation.id)
    if (foundIndex >= 0) {
      this.annotations[foundIndex] = annotation
    } else {
      this.annotations.push(annotation)
    }

    if (annotation.annotationVisible) {
      this.addAnnotationOnViewer(annotation)
    }
    this.storeToLocalStorage()
  }

  addAnnotationOnViewer(annotation) {
    const annotationLayer = this.viewer.layerManager.getLayerByName(USER_ANNOTATION_LAYER_NAME).layer
    const annotations = annotationLayer.localAnnotations.toJSON()

    // ToDo Still some error with the logic
    // const position1Voxel = this.annotationForm.controls.position1.value.split(',')
    //   .map((r, i) => r/this.voxelSize[i])
    // const position2Voxel = this.annotationForm.controls.position2.value.split(',')
    //   .map((r, i) => r/this.voxelSize[i])

    const position1Voxel = annotation.position1.split(',')
    const position2Voxel = annotation.position2.split(',')

    annotations.push({
      description: annotation.description? annotation.description : '',
      id: annotation.id,
      point: annotation.type === 'point'? annotation.position1.split(',') : null,
      pointA: annotation.type === 'line' || annotation.type === 'bounding box'?
        position1Voxel : null,
      pointB: annotation.type === 'line' || annotation.type === 'bounding box'?
        position2Voxel : null,
      center: annotation.type === 'ellipsoid'?
        position1Voxel : null,
      radii: annotation.type === 'ellipsoid'?
        position2Voxel : null,
      type: annotation.type !== 'bounding box'?
        annotation.type.toUpperCase() : 'axis_aligned_bounding_box'
    })

    annotationLayer.localAnnotations.restoreState(annotations)
  }

  toggleAnnotationView(i) {
    if (this.expanded === i) {
      this.expanded = -1
    } else {
      this.expanded = i
    }
  }

  toggleAnnotationVisibility(id) {
    const annotationIndex = this.annotations.findIndex(a => a.id === id)

    if (this.annotations[annotationIndex].annotationVisible) {
      this.removeAnnotationFromViewer(id)
      this.annotations[annotationIndex].annotationVisible = false
    } else {
      this.addAnnotationOnViewer(this.annotations[annotationIndex])
      this.annotations[annotationIndex].annotationVisible = true
    }
    this.storeToLocalStorage()
  }

  removeAnnotation(id) {
    this.removeAnnotationFromViewer(id)
    this.annotations = this.annotations.filter(a => a.id !== id)
    this.expanded = -1
    this.storeToLocalStorage()
  }

  storeToLocalStorage() {
    window.localStorage.setItem(USER_ANNOTATION_STORE_KEY, JSON.stringify(this.annotations))
  }

  removeAnnotationFromViewer(id) {
    const annotationLayer = this.viewer.layerManager.getLayerByName(USER_ANNOTATION_LAYER_NAME)?.layer
    if (annotationLayer) {
      let annotations = annotationLayer.localAnnotations.toJSON()
      annotations = annotations.filter(a => a.id !== id)
      annotationLayer.localAnnotations.restoreState(annotations)
    }
  }

  // navigate(coord) {
  //   this.store.dispatch(
  //     viewerStateChangeNavigation({
  //       navigation: {
  //         position: coord,
  //         animation: {},
  //       }
  //     })
  //   )
  // }

  public annotationLayerObj = {"user_annotations": {
    "type": "annotation",
    "tool": "annotateBoundingBox",
    "name": USER_ANNOTATION_LAYER_NAME,
    "annotationColor": "#ffee00",
    "annotations": [],
  }}
}
