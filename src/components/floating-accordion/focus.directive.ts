import { ContentChildren, Directive, ElementRef, EventEmitter, Output, QueryList, inject } from "@angular/core";
import { MatExpansionPanel } from "@angular/material/expansion";
import { Store, select } from "@ngrx/store";
import { combineLatest, concat, merge, of } from "rxjs";
import { debounceTime, distinctUntilChanged, map, switchMap, takeUntil } from "rxjs/operators";
import { atlasSelection, userInteraction } from "src/state";
import { arrayEqual } from "src/util/array";
import { ACCORDION_IDS } from "src/util/constants";
import { DestroyDirective } from "src/util/directives/destroy.directive";
import { switchMapWaitFor } from "src/util/fn";


@Directive({
  selector: '[accordionFocus]',
  standalone: true,
  hostDirectives: [
    DestroyDirective
  ],
  exportAs: "accordionFocus"
})
export class FocusDirective {

  @Output()
  allClosed = new EventEmitter<null>()

  @Output()
  someOpened = new EventEmitter<null>()

  destroyed$ = inject(DestroyDirective).destroyed$

  @ContentChildren(MatExpansionPanel)
  expansionPanels: QueryList<MatExpansionPanel>

  
  @ContentChildren(MatExpansionPanel, { read: ElementRef })
  expansionPanelElRefs: QueryList<ElementRef>

  #expansionPanelMap$ = of(null).pipe(
    switchMap(
      switchMapWaitFor(({
        condition: () => !!this.expansionPanelElRefs && !!this.expansionPanels,
        interval: 16,
        leading: true
      }))
    ),
    switchMap(() => concat(
      of(null),
      merge(
        this.expansionPanelElRefs.changes,
        this.expansionPanels.changes,
      )
    ).pipe(
      debounceTime(160),
      map(() => {
        const idToPanelRecord: Partial<Record<keyof typeof ACCORDION_IDS, MatExpansionPanel>> = {}
        const panels = Array.from(this.expansionPanels)
        
        this.expansionPanelElRefs.forEach((elRef, idx) => {
          for (const [ key, value ] of Object.entries(ACCORDION_IDS)) {
            const _key = key as keyof typeof ACCORDION_IDS
            if (value === elRef.nativeElement.id) {
              if (!!idToPanelRecord[_key]) {
                console.warn(`Multiple ids ${elRef.nativeElement.id} found! Overwrwiting the previous entries.`)
              }
              if (!panels[idx]) {
                console.warn(`Panel and elementref have different length!`)
                return
              }
              idToPanelRecord[_key] = panels[idx]
              return
            }
          }
          console.warn(`Expansion panel with id ${elRef.nativeElement.id} not accounted for!`)
        })
        return idToPanelRecord
      })
    ))
  )

  constructor(store: Store){
    
    merge(
      store.pipe(
        select(atlasSelection.selectors.selectedRegions),
        distinctUntilChanged(arrayEqual((o, n) => o.name === n.name)),
        map(selectedRegions => {
          return {
            selectedRegions,
            selectedPoint: null,
            selectedFeature: null,
          }
        })
      ),
      store.pipe(
        select(atlasSelection.selectors.selectedPoint),
        map(selectedPoint => {
          return {
            selectedPoint,
            selectedFeature: null,
            selectedRegions: [],
          }
        })
      ),
      store.pipe(
        select(userInteraction.selectors.selectedFeature),
        map(selectedFeature => {
          return {
            selectedFeature,
            selectedPoint: null,
            selectedRegions: [],
          }
        })
      )
    ).pipe(
      switchMap(selected => this.#expansionPanelMap$.pipe(
        map(panelMap => {
          return {
            selected,
            panelMap
          }
        })
      )),
      takeUntil(this.destroyed$)
    ).subscribe(({ selected: { selectedFeature, selectedPoint, selectedRegions }, panelMap }) => {
      if (selectedFeature && panelMap.SELECTED_FEATURE) {
        panelMap.SELECTED_FEATURE.open()
        return
      }
      if (selectedPoint && panelMap.SELECTED_POINT) {
        panelMap.SELECTED_POINT.open()
        return
      }
      if (selectedRegions?.length > 0 && panelMap.SELECTED_REGION) {
        panelMap.SELECTED_REGION.open()
        return
      }
    })

    this.#expansionPanelMap$.pipe(
      takeUntil(this.destroyed$),
      switchMap(rec => {
        const arr = Object.values(rec)
        
        return combineLatest(
          arr.map(
            item => concat(
              of(item.expanded),
              item.expandedChange
            )
          )
        )
      })
    ).subscribe(rec => {
      if (rec.every(flag => !flag)) {
        this.allClosed.next(null)
        return
      }
      if (rec.some(flag => flag)) {
        this.someOpened.next(null)
        return
      }
    })
  }
}
