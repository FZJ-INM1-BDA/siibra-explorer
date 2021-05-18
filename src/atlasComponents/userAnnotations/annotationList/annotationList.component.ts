import {Component} from "@angular/core";
import {AnnotationService} from "src/atlasComponents/userAnnotations/annotationService.service";

@Component({
  selector: 'annotation-list',
  templateUrl: './annotationList.template.html',
  styleUrls: ['./annotationList.style.css']
})
export class AnnotationList {

  public annotationFilter: 'all' | 'current' = 'all'
  public editing = -1

  get annotationsToShow() {
    return this.ans.annotations
      .filter(a => (a.type !== 'polygon' || +a.id.split('_')[1] === 0)
        && (this.annotationFilter === 'all' || a.templateName === this.ans.selectedTemplate))
  }

  constructor(public ans: AnnotationService) {}

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

}
