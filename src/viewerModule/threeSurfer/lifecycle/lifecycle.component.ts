import { Component, EventEmitter, Output } from "@angular/core";
import { Store } from "@ngrx/store";
import { merge } from "rxjs";
import { debounceTime, mapTo } from "rxjs/operators";
import { atlasSelection } from "src/state";
import { TViewerEvent } from "src/viewerModule/viewer.interface";

/**
 * TODO this compnent destroys and recreates thresurfer on parc change
 * ideally, this should be handlable in three surfer component
 * need to refactor threesurfer glu cmp to be more declarative
 */

@Component({
  selector: 'tmp-threesurfer-lifecycle',
  template: `
    <three-surfer-glue-cmp
      *ngIf="showThreeSurfer$ | async"
      (viewerEvent)="handleViewerEvent($event)">
    </three-surfer-glue-cmp>
    `
})

export class TmpThreeSurferLifeCycle{
  @Output()
  viewerEvent = new EventEmitter<TViewerEvent<"threeSurfer">>()
  handleViewerEvent(ev: TViewerEvent<"threeSurfer">){
    this.viewerEvent.emit(ev)
  }

  constructor(private store: Store){

  }

  #onATP = this.store.pipe(
    atlasSelection.fromRootStore.distinctATP()
  )
  showThreeSurfer$ = merge(
    this.#onATP.pipe(
      mapTo(false)
    ),
    this.#onATP.pipe(
      debounceTime(160),
      mapTo(true)
    )
  )
}
