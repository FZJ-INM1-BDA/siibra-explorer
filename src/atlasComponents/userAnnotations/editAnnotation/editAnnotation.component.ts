import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  Optional,
  Output
} from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { animate, style, transition, trigger } from "@angular/animations";
import { Observable, Subscription } from "rxjs";
import { filter } from "rxjs/operators";
import { select, Store } from "@ngrx/store";
import { viewerStateSelectedTemplateSelector } from "src/services/state/viewerState/selectors";
import { NEHUBA_INSTANCE_INJTKN  } from "src/viewerModule/nehuba/util";

@Component({
  selector: 'edit-annotation',
  templateUrl: './editAnnotation.template.html',
  styleUrls: ['./editAnnotation.style.css'],
  animations: [
    // doesn't do anything?
    trigger(
      'enterAnimation', [
        transition(':enter', [
          style({transform: 'translateY(100%)', opacity: 0}),
          animate('100ms', style({transform: 'translateY(0)', opacity: 1}))
        ]),
        // transition(':leave', [
        //   style({transform: 'translateY(0)', opacity: 1}),
        //   animate('100ms', style({transform: 'translateY(100%)', opacity: 0}))
        // ])
      ]
    )
  ],
})
export class EditAnnotationComponent implements OnInit, OnDestroy {

    @Input() editingAnnotation: any
    @Input() showOnFocus = false
    @Input() cursorOut = false

    @Output() saveAnnotation: EventEmitter<any> = new EventEmitter()
    @Output() selectingOutput: EventEmitter<any> = new EventEmitter()
    @Output() editingMode: EventEmitter<any> = new EventEmitter()

    public selecting: string
    public position1Selected = false
    public position2Selected = false

    public showFull = false
    public annotationForm: FormGroup
    public loading = false
    public mousePos

    public selectedTemplate: string
    public ellipsoidMinRadius = 0.2

    // public voxelSize

    public subscriptions: Subscription[] = []

    public annotationTypes = [{name: 'Point', class: 'fas fa-circle'},
      {name: 'Line', class: 'fas fa-slash', twoCoordinates: true},
      {name: 'Bounding box', class: 'far fa-square', twoCoordinates: true},
      {name: 'Ellipsoid', class: 'fas fa-bullseye', twoCoordinates: true}]
    public selectedType: any

    get nehubaViewer() {
      return (window as any).nehubaViewer
    }
    get interactiveViewer() {
      return (window as any).interactiveViewer
    }

    private viewer: any

    constructor(
      private formBuilder: FormBuilder,
      private changeDetectionRef: ChangeDetectorRef,
      private store: Store<any>,
      @Optional() @Inject(NEHUBA_INSTANCE_INJTKN) nehuba$: Observable<any>
    ) {
      this.annotationForm = this.formBuilder.group({
        id: [{value: null, disabled: true}],
        position1: [{value: '', disabled: this.loading}],
        position2: [{value: '', disabled: this.loading}],
        name: [{value: '', disabled: this.loading}, {
          validators: [Validators.maxLength(200)]
        }],
        description: [{value: '', disabled: this.loading}, {
          validators: [Validators.maxLength(1000)]
        }],
        templateName: [{value: ''}],
        type: [{value: 'point'}],
        annotationVisible: [true]
      })

      this.subscriptions.push(
        nehuba$.subscribe(v => this.viewer = v)
      )
    }

    ngOnInit() {
      this.selectType(this.annotationTypes[0])

      this.subscriptions.push(
        this.nehubaViewer.mousePosition.inVoxels
          .subscribe(floatArr => {
            // this.mousePos = floatArr && Array.from(floatArr).map((val: number) => val / 1e6)
            this.mousePos = floatArr && floatArr

            if (this.selecting === 'position1' && this.mousePos) {
              this.annotationForm.controls.position1.setValue(this.mousePos.join())
            } else if (this.selecting === 'position2' && this.mousePos) {
              if (this.annotationForm.controls.type.value === 'ellipsoid') {
                this.annotationForm.controls.position2.setValue([
                  this.getRadii(this.annotationForm.controls.position1.value.split(',').map(n => +n), this.mousePos),
                ].join())
              } else {
                this.annotationForm.controls.position2.setValue(this.mousePos.join())
              }

              if (this.annotationForm.controls.position1.value
                  && this.selectedType.twoCoordinates
                  && this.annotationForm.controls.position2.value) {
                this.setAnnotation()
              }
            }
          }),

        this.interactiveViewer.viewerHandle.mouseEvent.pipe(
          filter((e: any) => e.eventName === 'click')
        ).subscribe(() => {
          if (this.selecting === 'position1' && this.annotationForm.controls.position1.value) {
            this.selectPosition1()
            if (this.selectedType.twoCoordinates) {
              this.changeSelectingPoint('position2')
            } else {
              this.changeSelectingPoint('')
            }
            this.changeDetectionRef.detectChanges()
          } else if (this.selecting === 'position2' && this.mousePos) {
            this.selectPosition2()
          }
        }),
        this.store.pipe(
          select(viewerStateSelectedTemplateSelector)
        ).subscribe(tmpl => {
          this.annotationForm.controls.templateName.setValue(tmpl.name)
          this.selectedTemplate = tmpl.name
        })
      )

      // this.voxelSize = this.nehubaViewer.config.dataset.initialNgState.navigation.pose.position.voxelSize
    }

    changeSelectingPoint(selecting) {
      this.selecting = selecting
      this.selectingOutput.emit(selecting)
    }

    selectPosition1() {
      this.position1Selected = true
      if (!this.selectedType.twoCoordinates) {
        this.changeSelectingPoint('')
        this.setAnnotation()
      }

    }

    selectPosition2() {
      this.position2Selected = true
      this.changeSelectingPoint('')
      this.changeDetectionRef.detectChanges()

      if (this.position1Selected) {
        this.changeSelectingPoint('')
        this.setAnnotation()
      }
    }

    position1CursorOut() {
      if (this.annotationForm.controls.position1.value && !this.cursorOut) {
        this.selectPosition1()
      }
    }
    position2CursorOut() {
      if (this.annotationForm.controls.position2.value && !this.cursorOut) {
        this.selectPosition2()
      }
    }

    selectType(type) {
      this.selectedType = type
      this.annotationForm.controls.type.setValue(type.name.toLowerCase())
      this.annotationForm.controls.position1.setValue('')
      this.annotationForm.controls.position2.setValue('')
      if (!this.showOnFocus || this.showFull) this.changeSelectingPoint('position1')
      this.position1Selected = false
      this.position2Selected = false
    }

    focusInName() {
      if (this.showOnFocus) {
        if (!this.showFull) {
          this.changeSelectingPoint('position1')
        }
        this.showFull = true
        this.editingMode.emit(this.showFull)
      }
    }

    setAnnotation() {
      const annotationLayer = this.viewer.layerManager.getLayerByName('user_annotations').layer
      const annotations = annotationLayer.localAnnotations.toJSON()

      // ToDo Still some error with the logic
      // const position1Voxel = this.annotationForm.controls.position1.value.split(',')
      //   .map((r, i) => r/this.voxelSize[i])
      // const position2Voxel = this.annotationForm.controls.position2.value.split(',')
      //   .map((r, i) => r/this.voxelSize[i])

      const position1Voxel = this.annotationForm.controls.position1.value.split(',')
      const position2Voxel = this.annotationForm.controls.position2.value.split(',')

      annotations.push({
        description: this.annotationForm.controls.description.value? this.annotationForm.controls.description.value : '',
        id: 'adding',
        point: this.annotationForm.controls.type.value === 'point'? this.annotationForm.controls.position1.value.split(',') : null,
        pointA: this.annotationForm.controls.type.value === 'line' || this.annotationForm.controls.type.value === 'bounding box'?
          position1Voxel : null,
        pointB: this.annotationForm.controls.type.value === 'line' || this.annotationForm.controls.type.value === 'bounding box'?
          position2Voxel : null,
        center: this.annotationForm.controls.type.value === 'ellipsoid'?
          position1Voxel : null,
        radii: this.annotationForm.controls.type.value === 'ellipsoid'?
          position2Voxel : null,
        type: this.annotationForm.controls.type.value !== 'bounding box'?
          this.annotationForm.controls.type.value.toUpperCase() : 'axis_aligned_bounding_box'
      })

      annotationLayer.localAnnotations.restoreState(annotations)
    }

    getRadii(a, b) {
      const returnArray = [Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]), Math.abs(b[2] - a[2])]
        .map(n => n === 0? this.ellipsoidMinRadius : n)
      return returnArray
    }

    removeLoadingAnnotation() {
      const annotationLayer = this.viewer.layerManager.getLayerByName('user_annotations')?.layer
      if (annotationLayer) {
        const annotations = annotationLayer.localAnnotations.toJSON()
        annotationLayer.localAnnotations.restoreState(annotations.filter(a => a.id !== 'adding'))
      }
    }

    submitForm() {
      if (this.annotationForm.valid) {
        // this.annotationForm.controls.annotationVisible.setValue('true')
        this.saveAnnotation.emit(this.annotationForm.value)
        this.cancelEditing()
      }
    }

    cancelEditing() {
      if (this.showOnFocus) {
        this.showFull = false
        this.editingMode.emit(this.showFull)
      }
      this.resetForm()
    }

    resetForm() {
      this.annotationForm.reset()
      this.annotationForm.markAsPristine()
      this.annotationForm.markAsUntouched()

      // Set form defaults
      this.annotationForm.controls.annotationVisible.setValue(true)
      this.annotationForm.controls.templateName.setValue(this.selectedTemplate)
      this.annotationForm.controls.templateName.setValue(this.selectedTemplate)

      this.position1Selected = false
      this.position1Selected = false
      this.selectType(this.annotationTypes[0])
      this.removeLoadingAnnotation()
      this.changeSelectingPoint('')

      Object.keys(this.annotationForm.controls).forEach(key => {
        this.annotationForm.get(key).setErrors(null)
      })
    }

    ngOnDestroy() {
      this.subscriptions.forEach(s => s.unsubscribe())
    }

}
