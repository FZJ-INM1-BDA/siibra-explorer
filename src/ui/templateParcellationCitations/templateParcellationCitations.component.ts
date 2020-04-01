import { Component } from "@angular/core";
import { select, Store } from "@ngrx/store";
import { Observable } from "rxjs";
import { map, switchMap } from "rxjs/operators";
import { safeFilter, ViewerStateInterface } from "../../services/stateStore.service";

@Component({
  selector : 'template-parcellation-citation-container',
  templateUrl : './templateParcellationCitations.template.html',
  styleUrls : [
    './templateParcellationCitations.style.css',
  ],
})

export class TemplateParcellationCitationsContainer {
  public selectedTemplate$: Observable<any>
  public selectedParcellation$: Observable<any>

  constructor(private store: Store<ViewerStateInterface>) {
    this.selectedTemplate$ = this.store.pipe(
      select('viewerState'),
      safeFilter('templateSelected'),
      map(state => state.templateSelected),
    )

    this.selectedParcellation$ = this.selectedTemplate$.pipe(
      switchMap(() => this.store.pipe(
        select('viewerState'),
        safeFilter('parcellationSelected'),
        map(state => state.parcellationSelected),
      )),
    )
  }
}
