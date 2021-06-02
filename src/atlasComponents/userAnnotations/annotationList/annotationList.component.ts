import {Component} from "@angular/core";
import {AnnotationService} from "src/atlasComponents/userAnnotations/annotationService.service";
import {viewerStateChangeNavigation} from "src/services/state/viewerState/actions";
import {Store} from "@ngrx/store";
import {ARIA_LABELS} from "common/constants";

@Component({
  selector: 'annotation-list',
  templateUrl: './annotationList.template.html',
  styleUrls: ['./annotationList.style.css']
})
export class AnnotationList {

  public ARIA_LABELS = ARIA_LABELS
  public identifier = (index: number, item: any) => item.id

  constructor(private store$: Store<any>, public ans: AnnotationService) {}

  toggleAnnotationVisibility(annotation) {
    if (annotation.type === 'polygon') {
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

  navigate(positionString: string) {
    const position = positionString.split(',').map(p => +p * 1e6)

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

  saveAnnotation(annotation, singlePolygon = false) {
    if (annotation.type !== 'polygon' || singlePolygon) {
      annotation.position1 = annotation.position1.replace(/\s/g, '')
      annotation.position2 = annotation.position2 && annotation.position2.replace(/\s/g, '')
      if (annotation.position1.split(',').length !== 3 || !annotation.position1.split(',').every(e => !!e)
          || ((annotation.position2
              && annotation.position2.split(',').length !== 3) || !annotation.position1.split(',').every(e => !!e))) {
        return
      } else {
        annotation.position1 = this.ans.mmToVoxel(annotation.position1.split(',')).join()
        annotation.position2 = annotation.position2 && this.ans.mmToVoxel(annotation.position2.split(',')).join()
      }
      this.ans.saveAnnotation(annotation)
    } else {
      if (!annotation.name) {
        annotation.name = this.ans.giveNameByType('polygon')
      }

      const toUpdateFirstAnnotation = this.ans.pureAnnotationsForViewer.find(a => a.id === `${annotation.id}_0`)
      toUpdateFirstAnnotation.name = annotation.name
      toUpdateFirstAnnotation.description = annotation.description
      this.ans.saveAnnotation(toUpdateFirstAnnotation)

      const toUpdate = this.ans.groupedAnnotations.findIndex(a => a.id === annotation.id)
      this.ans.groupedAnnotations[toUpdate].name = annotation.name
      this.ans.groupedAnnotations[toUpdate].description = annotation.description
      this.ans.refreshAnnotationFilter()

    }
  }

  savePolygonPosition(id, position, inputVal) {
    inputVal = inputVal.replace(/\s/g, '')
    if (inputVal.split(',').length !== 3 || !inputVal.split(',').every(e => !!e)) {
      return
    } else {
      inputVal = this.ans.mmToVoxel(inputVal.split(',')).join()
    }
    position.lines.forEach(l => {
      if (l.point === 2) {
        const annotation = this.ans.pureAnnotationsForViewer.find(a => a.id === l.id)
        annotation.position2 = inputVal
        this.saveAnnotation(annotation, true)
      } else {
        const annotation = this.ans.pureAnnotationsForViewer.find(a => a.id === l.id)
        annotation.position1 = inputVal
        this.saveAnnotation(annotation, true)
      }
    })
  }

}
