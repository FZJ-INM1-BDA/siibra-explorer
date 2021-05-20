import {Component} from "@angular/core";
import {AnnotationService} from "src/atlasComponents/userAnnotations/annotationService.service";
import {viewerStateChangeNavigation} from "src/services/state/viewerState/actions";
import {Store} from "@ngrx/store";

@Component({
  selector: 'annotation-list',
  templateUrl: './annotationList.template.html',
  styleUrls: ['./annotationList.style.css']
})
export class AnnotationList {

  public editing = -1

  get annotationsToShow() {
    return this.ans.annotations
    // .filter(a => this.annotationFilter === 'all' || a.templateName === this.ans.selectedTemplate)
    // .filter(a => (a.type !== 'polygon' || +a.id.split('_')[1] === 0)

    // let transformed = [...this.ans.annotations]
    //
    // for (let i = 0; i<this.ans.annotations.length; i++) {
    //   if (this.ans.annotations[i].type === 'polygon') {
    //     const annotationId = this.ans.annotations[i].id.split('_')
    //     if (!transformed.find(t => t.id === annotationId[0])) {
    //       const polygonAnnotations = this.ans.annotations.filter(a => a.id.split('_')[0] === annotationId[0]
    //         && a.id.split('_')[1])
    //
    //       const polygonPositions = polygonAnnotations.map((a, i) => {
    //         return i-1 !== polygonAnnotations.length? {
    //           position: a.position1,
    //           lines: [
    //             {id: a.id, point: 2},
    //             {id: polygonAnnotations[i+1], point: 1}
    //           ]
    //         } : polygonAnnotations[i].position2 !== polygonAnnotations[0].position1? {
    //           position: a.position2,
    //           lines: [
    //             {id: a.id, point: 2}
    //           ]
    //         } : null
    //       })
    //
    //       transformed = transformed.filter(a => a.id.split('_')[0] !== annotationId[0])
    //
    //       transformed.push({
    //         id: annotationId[0],
    //         name: this.ans.annotations[i].name,
    //         type: 'polygon',
    //         annotations: polygonAnnotations,
    //         positions: polygonPositions,
    //         annotationVisible: this.ans.annotations[i].annotationVisible,
    //         templateName: this.ans.annotations[i].templateName
    //       })
    //     }
    //   }
    // }
    // return transformed
  }

  public identifyer = (index: number, item: any) => item.id

  constructor(private store$: Store<any>, public ans: AnnotationService) {}

  toggleAnnotationVisibility(annotation) {
    if (annotation.type === 'polygon') {
      this.ans.annotations.filter(an => an.id.split('_')[0] === annotation.id.split('_')[0])
        .forEach(a => this.toggleVisibility(a))
    } else {
      this.toggleVisibility(annotation)
    }
  }

  toggleVisibility(annotation) {
    const annotationIndex = this.ans.annotations.findIndex(a => a.id === annotation.id)

    if (this.ans.annotations[annotationIndex].annotationVisible) {
      this.ans.removeAnnotationFromViewer(annotation.id)
      this.ans.annotations[annotationIndex].annotationVisible = false
    } else {
      this.ans.addAnnotationOnViewer(this.ans.annotations[annotationIndex])
      this.ans.annotations[annotationIndex].annotationVisible = true
    }
    this.ans.storeToLocalStorage()
  }

  removeAnnotation(annotation) {
    if (annotation.type === 'polygon') {
      this.ans.annotations.filter(an => an.id.split('_')[0] === annotation.id.split('_')[0])
        .forEach(a => this.ans.removeAnnotation(a.id))
    } else {
      this.ans.removeAnnotation(annotation.id)
    }
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

  saveAnnotation(annotation) {
    if (annotation.position1.split(',').length !== 3 || !annotation.position1.split(',').every(e => !!e)
        || ((annotation.position2
            && annotation.position2.split(',').length !== 3) || !annotation.position1.split(',').every(e => !!e))) {
      return
    }
    this.ans.saveAnnotation(annotation)
  }

  savePolygonPosition(position, inputVal) {
    position.lines.forEach(l => {
      if (l.point === 2) {
        const annotation = this.ans.annotations.find(a => a.id === l.id)
        annotation.position2 = inputVal
        this.saveAnnotation(annotation)
      } else {
        const annotation = this.ans.annotations.find(a => a.id === l.id)
        annotation.position1 = inputVal
        this.saveAnnotation(annotation)
      }
    })
  }

}
