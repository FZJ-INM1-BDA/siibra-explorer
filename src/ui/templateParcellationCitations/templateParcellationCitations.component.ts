import { Component } from "@angular/core";
import { Observable } from "rxjs";
import { ViewerStateInterface, isDefined, safeFilter } from "../../services/stateStore.service";
import { Store, select } from "@ngrx/store";
import { filter, switchMap, map } from "rxjs/operators";

@Component({
  selector : 'template-parcellation-citation-container',
  templateUrl : './templateParcellationCitations.template.html',
  styleUrls : [
    './templateParcellationCitations.style.css'
  ]
})

export class TemplateParcellationCitationsContainer{
  selectedTemplate$: Observable<any>
  selectedParcellation$: Observable<any>

  constructor(private store: Store<ViewerStateInterface>){
    this.selectedTemplate$ = this.store.pipe(
      select('viewerState'),
      safeFilter('templateSelected'),
      map(state => state.templateSelected)
    )

    this.selectedParcellation$ = this.selectedTemplate$.pipe(
      switchMap(() => this.store.pipe(
        select('viewerState'),
        safeFilter('parcellationSelected'),
        map(state => state.parcellationSelected)
      ))
    )
  }
}