import { Component } from "@angular/core";
import { Store } from "@ngrx/store";
import { ModularUserAnnotationToolService } from "../tools/service";
import { viewerStateSetViewerMode } from "src/services/state/viewerState.store.helper";
import { ARIA_LABELS } from 'common/constants'

@Component({
  selector: 'annotating-tools-panel',
  templateUrl: './annotationMode.template.html',
  styleUrls: ['./annotationMode.style.css']
})
export class AnnotationMode {

  public ARIA_LABELS = ARIA_LABELS

  public moduleAnnotationTypes: {
    instance: {
      name: string
      iconClass: string
    }
    onClick: Function
  }[] = []

  constructor(
    private store$: Store<any>,
    private modularToolSvc: ModularUserAnnotationToolService,
  ) {
    this.moduleAnnotationTypes = this.modularToolSvc.moduleAnnotationTypes
  }

  exitAnnotationMode(){
    this.store$.dispatch(
      viewerStateSetViewerMode({
        payload: null
      })
    )
  }
  deselectTools(){
    console.log('deselect tools')
    this.modularToolSvc.deselectTools()
  }
}
