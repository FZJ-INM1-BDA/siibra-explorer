import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { animate, style, transition, trigger } from "@angular/animations";
import { Subscription } from "rxjs";
import {AnnotationService} from "src/atlasComponents/userAnnotations/annotationService.service";
import {viewerStateChangeNavigation} from "src/services/state/viewerState/actions";
import {Store} from "@ngrx/store";

@Component({
  selector: 'edit-annotation',
  templateUrl: './editAnnotation.template.html',
  animations: [
    trigger(
      'enterAnimation', [
        transition(':enter', [
          style({transform: 'translateY(100%)', opacity: 0}),
          animate('100ms', style({transform: 'translateY(0)', opacity: 1}))
        ]),
      ]
    )
  ],
})
export class EditAnnotationComponent implements OnInit, OnDestroy {

    @Input() annotation: any

    @Output() finished: EventEmitter<any> = new EventEmitter()

    public annotationForm: FormGroup

    public subscriptions: Subscription[] = []

    constructor(
      private formBuilder: FormBuilder,
      public ans: AnnotationService,
      private store$: Store<any>,
    ) {
      this.annotationForm = this.formBuilder.group({
        id: [{value: 'null'}],
        position1: [{value: ''}],
        position2: [{value: ''}],
        name: [{value: ''}, {
          validators: [Validators.maxLength(200)]
        }],
        description: [{value: ''}, {
          validators: [Validators.maxLength(1000)]
        }],
        templateName: [{value: ''}],
        type: [{value: ''}],
        annotationVisible: [{value: true}]
      })
    }

    ngOnInit() {
      this.annotationForm.controls.id.setValue(this.annotation.id)
      this.annotationForm.controls.position1.setValue(this.annotation.position1)
      this.annotationForm.controls.position2.setValue(this.annotation.position2)
      this.annotationForm.controls.name.setValue(this.annotation.name)
      this.annotationForm.controls.description.setValue(this.annotation.description)
      this.annotationForm.controls.templateName.setValue(this.annotation.templateName)
      this.annotationForm.controls.type.setValue(this.annotation.type)
      this.annotationForm.controls.annotationVisible.setValue(this.annotation.annotationVisible)
    }


    submitForm() {
      if (this.annotationForm.valid) {
        if (this.annotationForm.controls.position1.value.split(',').length !== 3 ||
            (this.annotationForm.controls.position2.value
                && this.annotationForm.controls.position2.value.split(',').length !== 3)) {
          return
        }
        this.ans.saveAnnotation(this.annotationForm.value)
        this.cancelEditing()
      }
    }

    cancelEditing() {
      this.finished.emit()
      this.resetForm()
    }

    resetForm() {
      this.annotationForm.reset()
      this.annotationForm.markAsPristine()
      this.annotationForm.markAsUntouched()

      this.annotationForm.controls.annotationVisible.setValue(true)
      Object.keys(this.annotationForm.controls).forEach(key => {
        this.annotationForm.get(key).setErrors(null)
      })
    }

    ngOnDestroy() {
      this.subscriptions.forEach(s => s.unsubscribe())
    }

    navigate(position) {
      //ToDo change for real position for all templates
      position = position.split(',').map(p => +p * 1e6)
      this.store$.dispatch(
        viewerStateChangeNavigation({
          navigation: {
            position,
            positionReal: true
          },
        })
      )
    }

}
