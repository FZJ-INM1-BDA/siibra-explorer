import { Component, OnDestroy } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { Store } from "@ngrx/store";
import { Observable, of, Subject, Subscription } from "rxjs";
import { filter, map, switchMap, tap, withLatestFrom } from "rxjs/operators";
import { SAPI } from "src/atlasComponents/sapi/sapi.service";
import { ParcellationSupportedInSpacePipe } from "src/atlasComponents/sapiViews/util/parcellationSupportedInSpace.pipe";
import { atlasSelection } from "src/state";
import { fromRootStore } from "src/state/atlasSelection";
import { DialogFallbackCmp } from "src/ui/dialogInfo";
import { ParcellationVisibilityService } from "../../../parcellation/parcellationVis.service";
import { defaultColorPalette, ATP } from "../pureDumb/pureATPSelector.components"

function isATPGuard(obj: any): obj is ATP {
  if (!obj) return false
  return obj.atlas || obj.template || obj.parcellation
}

@Component({
  selector: 'sxplr-wrapper-atp-selector',
  templateUrl: './wrapper.template.html',
  styleUrls: [
    `./wrapper.style.css`
  ]
})

export class WrapperATPSelector implements OnDestroy{
  defaultColorPalette = defaultColorPalette

  #subscription: Subscription[] = []
  #parcSupportedInSpacePipe = new ParcellationSupportedInSpacePipe(this.sapi)

  #askUser(title: string, descMd: string): Observable<boolean> {
    const agree = "OK"
    return this.dialog.open(DialogFallbackCmp, {
      data: {
        title,
        descMd,
        actions: [agree]
      }
    }).afterClosed().pipe(
      map(val => val === agree)
    )
  }

  selectedATP$ = this.store$.pipe(
    fromRootStore.distinctATP(),
  )

  allAtlases$ = this.sapi.atlases$
  availableTemplates$ = this.store$.pipe(
    fromRootStore.allAvailSpaces(this.sapi),
  )
  parcs$ = this.store$.pipe(
    fromRootStore.allAvailParcs(this.sapi),
  )
  isBusy$ = new Subject<boolean>()
  
  parcellationVisibility$ = this.svc.visibility$

  constructor(
    private dialog: MatDialog,
    private store$: Store,
    private sapi: SAPI,
    private svc: ParcellationVisibilityService,
  ){
    this.#subscription.push(
      this.selectLeaf$.pipe(
        tap(() => this.isBusy$.next(true)),
        withLatestFrom(this.selectedATP$),
        switchMap(([{ atlas, template, parcellation }, selectedATP]) => {
          if (atlas) {
            /**
             * do not need to ask permission to switch atlas
             */
            return of({ atlas })
          }
          if (template) {
            return this.#parcSupportedInSpacePipe.transform(selectedATP.parcellation, template).pipe(
              switchMap(supported => supported
                ? of({ template })
                : this.#askUser(`Incompatible parcellation`, `Attempting to load template **${template.fullName}**, which does not support parcellation **${selectedATP.parcellation.name}**. Proceed anyway and load the default parcellation?`).pipe(
                  switchMap(flag => of(flag ? { template } : null))
                ))
            )
          }
          if (parcellation) {
            return this.#parcSupportedInSpacePipe.transform(parcellation, selectedATP.template).pipe(
              switchMap(supported=> supported
                ? of({ parcellation })
                : this.#askUser(`Incompatible template`, `Attempting to load parcellation **${parcellation.name}**, which is not supported in template **${selectedATP.template.fullName}**. Proceed anyway and load the default template?`).pipe(
                  switchMap(flag => of(flag ? { parcellation } : null))
                ))
            )
          }
          return of(null)
        }),
        filter(val => {
          this.isBusy$.next(false)
          return !!val
        })
      ).subscribe((obj) => {

        if (!isATPGuard(obj)) return
        const { atlas, parcellation, template } = obj
        if (atlas) {
          this.store$.dispatch(
            atlasSelection.actions.selectAtlas({ atlas })
          )
        }
        if (parcellation) {
          this.store$.dispatch(
            atlasSelection.actions.selectParcellation({ parcellation })
          )
        }
        if (template) {
          this.store$.dispatch(
            atlasSelection.actions.selectTemplate({ template })
          )
        }
      })
    )
  }

  private selectLeaf$ = new Subject<ATP>()
  selectLeaf(atp: ATP) {
    this.selectLeaf$.next(atp)
  }

  toggleParcellationVisibility() {
    this.svc.toggleVisibility()
  }

  ngOnDestroy(): void {
    while (this.#subscription.length > 0) this.#subscription.pop().unsubscribe()
  }
}
