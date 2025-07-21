import { Directive } from "@angular/core";
import { ModularUserAnnotationToolService } from "../tools/service";

@Directive({
  selector: '[annotation-list-directive]',
  exportAs: 'annotationList',
})
export class AnnotationListDirective {

  public managedAnnotations$ = this.annotSvc.spaceFilteredManagedAnnotations$
  public annotationInOtherSpaces$ = this.annotSvc.otherSpaceManagedAnnotations$

  constructor(
    protected annotSvc: ModularUserAnnotationToolService
  ){}
}
