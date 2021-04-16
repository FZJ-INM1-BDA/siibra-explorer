import {AfterViewInit, Component, EventEmitter, Inject, OnDestroy, OnInit, Optional, Output} from "@angular/core";
import {VIEWER_INJECTION_TOKEN} from "src/ui/layerbrowser/layerDetail/layerDetail.component";
import {Store} from "@ngrx/store";

@Component({
  selector: 'user-annotations',
  templateUrl: './userAnnotationsCmp.template.html',
  styleUrls: ['./userAnnotationsCmp.style.css']
})
export class UserAnnotationsComponent implements OnInit, OnDestroy {

  public userAnnotationLayerName = 'user_annotations'
  public landmarkFilter: 'all' | 'current' = 'all'
  public cursorOut = false
  public selecting: string
  public editingMode = false
  public minimized = false
  public nameInLocalStorage = 'user_landmarks_demo_1'

  public hovering = -1
  public expanded = -1

  public annotations = []

  @Output() close: EventEmitter<any> = new EventEmitter()

  constructor(@Optional() @Inject(VIEWER_INJECTION_TOKEN) private injectedViewer,
              private store: Store<any>) {
  }

  private get viewer(){
    return this.injectedViewer || (window as any).viewer
  }

  ngOnDestroy(): void {
    const annotationLayer = this.viewer.layerManager.getLayerByName('user_annotations')
    if (annotationLayer) {
      this.viewer?.layerManager.removeManagedLayer(
          this.viewer.layerManager.getLayerByName('user_annotations'))
    }
  }

  ngOnInit(): void {
    this.loadAnnotationLayer()

    if (window.localStorage.getItem(this.nameInLocalStorage) && window.localStorage.getItem(this.nameInLocalStorage).length) {
      const annotationsString = window.localStorage.getItem(this.nameInLocalStorage)
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
      annotation.id = this.randomId
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
    const annotationLayer = this.viewer.layerManager.getLayerByName('user_annotations').layer
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
    window.localStorage.setItem(this.nameInLocalStorage, JSON.stringify(this.annotations))
  }

  removeAnnotationFromViewer(id) {
    const annotationLayer = this.viewer.layerManager.getLayerByName('user_annotations')?.layer
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
    "name": this.userAnnotationLayerName,
    "annotationColor": "#ffee00",
    "annotations": [],
  }}

  get randomId() {
    return Math.random().toString(36).substr(2, 9)
  }
}
