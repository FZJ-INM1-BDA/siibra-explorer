import {Component} from "@angular/core";
import {AnnotationService} from "src/atlasComponents/userAnnotations/annotationService.service";

@Component({
  selector: 'annotation-message',
  template: `<mat-card class="pe-all position-absolute d-flex align-items-center  annotation-mode-message-panel">
          <mat-panel-title>Annotation mode</mat-panel-title>
          <button mat-icon-button
                  color="warn"
                  (click)="ans.disable()"
                  type="button"
                  class="mb-2 mt-2"
                  matTooltip="Exit annotation mode">
              <i class="fas fa-times"></i>
          </button>
      </mat-card>`,
  styles: [`.annotation-mode-message-panel {height: 30px;top: 20px;right: 0;}`]
})
export class AnnotationMessage {
  constructor(public ans: AnnotationService) {}
}
