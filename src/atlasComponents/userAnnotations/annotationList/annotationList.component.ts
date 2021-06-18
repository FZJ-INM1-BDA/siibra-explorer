import {Component} from "@angular/core";
import {AnnotationService} from "src/atlasComponents/userAnnotations/annotationService.service";
import {ARIA_LABELS} from "common/constants";
import { ModularUserAnnotationToolService } from "../tools/service";
import { TExportFormats } from "../tools/type";
import { ComponentStore } from "src/viewerModule/componentStore";


@Component({
  selector: 'annotation-list',
  templateUrl: './annotationList.template.html',
  styleUrls: ['./annotationList.style.css'],
  providers: [
    ComponentStore,
  ]
})
export class AnnotationList {

  public ARIA_LABELS = ARIA_LABELS

  public managedAnnotations$ = this.annotSvc.managedAnnotations$
  constructor(
    private annotSvc: ModularUserAnnotationToolService,
    cStore: ComponentStore<{ useFormat: TExportFormats }>,
  ) {
    cStore.setState({
      useFormat: 'json'
    })
  }

  public hiddenAnnotations$ = this.annotSvc.hiddenAnnotations$
  toggleManagedAnnotationVisibility(id: string) {
    this.annotSvc.toggleAnnotationVisibilityById(id)
  }
}
