import {Component} from "@angular/core";
import {AnnotationService} from "src/atlasComponents/userAnnotations/annotationService.service";
import {viewerStateChangeNavigation} from "src/services/state/viewerState/actions";
import {Store} from "@ngrx/store";
import {ARIA_LABELS} from "common/constants";
import { ModularUserAnnotationToolService } from "../tools/service";
import { EXPORT_FORMAT_INJ_TOKEN, TExportFormats } from "../tools/type";


@Component({
  selector: 'annotation-list',
  templateUrl: './annotationList.template.html',
  styleUrls: ['./annotationList.style.css'],
  providers: [{
    provide: EXPORT_FORMAT_INJ_TOKEN,
    useFactory: (svc: ModularUserAnnotationToolService) => svc.exportFormat$,
    deps: [
      ModularUserAnnotationToolService
    ]
  }]
})
export class AnnotationList {

  public ARIA_LABELS = ARIA_LABELS
  public identifier = (index: number, item: any) => item.id

  public availableFormat: TExportFormats[] = ['json', 'sands', 'string']
  public exportFromat$ = this.annotSvc.exportFormat$
  public selectExportFormat(format: TExportFormats) {
    this.exportFromat$.next(format)
  }

  public managedAnnotations$ = this.annotSvc.managedAnnotations$
  constructor(private store$: Store<any>, public ans: AnnotationService, private annotSvc: ModularUserAnnotationToolService) {}

  toggleAnnotationVisibility(annotation) {
    if (annotation.type === 'polygon') {
      // ToDo Change when mainList will be groupedAnnotations
      const annotationIndex = this.ans.groupedAnnotations.findIndex(a => a.id === annotation.id)
      this.ans.groupedAnnotations[annotationIndex].annotationVisible = !this.ans.groupedAnnotations[annotationIndex].annotationVisible
      this.ans.refreshFinalAnnotationList()

      this.ans.pureAnnotationsForViewer.filter(an => an.id.split('_')[0] === annotation.id.split('_')[0])
        .forEach(a => this.toggleVisibility(a))
    } else {
      this.toggleVisibility(annotation)
    }
  }

  private toggleVisibility = (annotation) => {
    const annotationIndex = this.ans.pureAnnotationsForViewer.findIndex(a => a.id === annotation.id)

    if (this.ans.pureAnnotationsForViewer[annotationIndex].annotationVisible) {
      this.ans.removeAnnotationFromViewer(annotation.id)
      this.ans.pureAnnotationsForViewer[annotationIndex].annotationVisible = false
    } else {
      this.ans.addAnnotationOnViewer(this.ans.pureAnnotationsForViewer[annotationIndex])
      this.ans.pureAnnotationsForViewer[annotationIndex].annotationVisible = true
    }
    this.ans.storeToLocalStorage()
  }

  removeAnnotation(annotation) {
    if (annotation.type === 'polygon') {
      this.ans.pureAnnotationsForViewer.filter(an => an.id.split('_')[0] === annotation.id.split('_')[0])
        .forEach(a => this.ans.removeAnnotation(a.id))
    } else {
      this.ans.removeAnnotation(annotation.id)
    }
  }

  navigate(position: number[]) {
    // Convert to nm before navigate
    position = position.map(p => +p * 1e6)

    if (position && position.length === 3) {
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

  saveAnnotation(annotation) {
    if (annotation.type !== 'polygon') {

      // Convert to Number Array
      if (annotation.position1 && (typeof annotation.position1 === 'string')) {
        annotation.position1 = this.positionToNumberArray(annotation.position1)
      }
      if (annotation.position2 && (typeof annotation.position2 === 'string')) {
        annotation.position2 = this.positionToNumberArray(annotation.position2)
      }

      // Return if positions are valid
      if (annotation.position1.length !== 3 || !annotation.position1.every(e => !isNaN(e))
          || (annotation.position2 && (annotation.position2.length !== 3 || !annotation.position2.every(e => !isNaN(e))))) {
        return
      } else {
        // Convert to Voxel
        annotation.position1 = this.ans.mmToVoxel(annotation.position1)
        annotation.position2 = annotation.position2 && this.ans.mmToVoxel(annotation.position2)
      }
      // Save annotation
      this.ans.saveAnnotation(annotation)
    } else {

      // if (!annotation.name) {
      //   annotation.name = this.ans.generateNameByType('polygon')
      // }

      const toUpdateFirstAnnotation = this.ans.pureAnnotationsForViewer.find(a => a.id === `${annotation.id}_0`)
      toUpdateFirstAnnotation.name = annotation.name
      toUpdateFirstAnnotation.description = annotation.description
      this.ans.saveAnnotation(toUpdateFirstAnnotation)

      //ToDo Change when main list will be groupedAnnotations
      const toUpdate = this.ans.groupedAnnotations.findIndex(a => a.id === annotation.id)
      this.ans.groupedAnnotations[toUpdate].name = annotation.name
      this.ans.groupedAnnotations[toUpdate].description = annotation.description
      this.ans.refreshFinalAnnotationList()
    }
  }

  positionToNumberArray(position) {
    return position.split(',').map(n => parseFloat(n))
  }

  savePolygonPosition(id, position, inputVal) {
    inputVal = this.positionToNumberArray(inputVal)

    if (inputVal.length !== 3 || !inputVal.every(e => !isNaN(e))) {
      return
    } else {
      inputVal = this.ans.mmToVoxel(inputVal)
    }
    position.lines.forEach(l => {
      if (l.point === 2) {
        const annotation = this.ans.pureAnnotationsForViewer.find(a => a.id === l.id)
        annotation.position2 = inputVal
        this.ans.saveAnnotation(annotation, true)
      } else {
        const annotation = this.ans.pureAnnotationsForViewer.find(a => a.id === l.id)
        annotation.position1 = inputVal
        this.ans.saveAnnotation(annotation, true)
      }
    })
  }

  public hiddenAnnotations$ = this.annotSvc.hiddenAnnotations$
  toggleManagedAnnotationVisibility(id: string) {
    this.annotSvc.toggleAnnotationVisibilityById(id)
  }
}
