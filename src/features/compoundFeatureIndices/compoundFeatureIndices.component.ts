import { Component, EventEmitter, Input, Output, inject, ViewChild } from "@angular/core";
import { BehaviorSubject, combineLatest } from "rxjs";
import { map, switchMap } from "rxjs/operators";
import { SxplrTemplate } from "src/atlasComponents/sapi/sxplrTypes";
import { MatTableDataSource, MatPaginator } from "src/sharedModules";
import { DestroyDirective } from "src/util/directives/destroy.directive";
import { CFIndex } from "./util";
import { switchMapWaitFor } from "src/util/fn";

@Component({
  selector: 'compound-feature-indices',
  templateUrl: './compoundFeatureIndices.template.html',
  styleUrls: [
    './compoundFeatureIndices.style.css'
  ],
  hostDirectives: [
    DestroyDirective
  ]
})

export class CompoundFeatureIndices {

  public columns = ['name']

  @ViewChild(MatPaginator)
  paginator: MatPaginator

  readonly #destroy$ = inject(DestroyDirective).destroyed$

  #indices$ = new BehaviorSubject<CFIndex[]>([] as CFIndex[])
  #ds$ = this.#indices$.pipe(
    switchMap(
      switchMapWaitFor({
        condition: () => !!this.paginator,
        interval: 160,
        leading: true
      })
    ),
    map(points => {
      const ds = new MatTableDataSource(points)
      ds.paginator = this.paginator
      return ds
    })
  )

  #selectedTemplate$ = new BehaviorSubject<SxplrTemplate>(null)

  @Input('indices')
  set indices(val: CFIndex[]) {
    this.#indices$.next(val)
  }

  @Input('selected-template')
  set selectedTemplate(tmpl: SxplrTemplate){
    this.#selectedTemplate$.next(tmpl)
  }

  view$ = combineLatest([
    this.#indices$,
    this.#ds$,
    this.#selectedTemplate$,
  ]).pipe(
    map(([ indices, datasource, selectedTemplate ]) => {
      return {
        indices,
        datasource,
        selectedTemplate,
      }
    })
  )

  @Output('on-click-index')
  onClick = new EventEmitter<CFIndex>()

  handleOnClick(item: CFIndex){
    this.onClick.next(item)
  }
}
