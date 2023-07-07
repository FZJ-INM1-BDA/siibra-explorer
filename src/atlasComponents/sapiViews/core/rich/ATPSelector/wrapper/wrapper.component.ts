import { Component, Inject, OnDestroy } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { select, Store } from "@ngrx/store";
import { Observable, of, Subject, Subscription } from "rxjs";
import { filter, map, switchMap, tap, withLatestFrom } from "rxjs/operators";
import { SAPI } from "src/atlasComponents/sapi/sapi.service";
import { atlasAppearance, atlasSelection } from "src/state";
import { fromRootStore } from "src/state/atlasSelection";
import { DialogFallbackCmp } from "src/ui/dialogInfo";
import { DARKTHEME } from "src/util/injectionTokens";
import { ParcellationVisibilityService } from "../../../parcellation/parcellationVis.service";
import { darkThemePalette, lightThemePalette, ATP } from "../pureDumb/pureATPSelector.components"

type AskUserConfig = {
  actionsAsList: boolean
}

function isATPGuard(obj: any): obj is Partial<ATP&{ requested: Partial<ATP> }> {
  if (!obj) return false
  return (obj.atlas || obj.template || obj.parcellation) && (!obj.requested || isATPGuard(obj.requested))
}

@Component({
  selector: 'sxplr-wrapper-atp-selector',
  templateUrl: './wrapper.template.html',
  styleUrls: [
    `./wrapper.style.css`
  ]
})

export class WrapperATPSelector implements OnDestroy{
  darkThemePalette = darkThemePalette
  lightThemePalette = lightThemePalette

  #subscription: Subscription[] = []

  #askUser(title: string, descMd: string, actions: string[], config?: Partial<AskUserConfig>): Observable<string> {
    return this.dialog.open(DialogFallbackCmp, {
      data: {
        title,
        descMd,
        actions: actions,
        actionsAsList: config?.actionsAsList
      }
    }).afterClosed()
  }

  selectedATP$ = this.store$.pipe(
    fromRootStore.distinctATP(),
  )

  allAtlases$ = this.sapi.atlases$
  availableTemplates$ = this.store$.pipe(
    select(atlasSelection.selectors.selectedAtlas),
    switchMap(atlas => this.sapi.getAllSpaces(atlas))
  )
  parcs$ = this.store$.pipe(
    select(atlasSelection.selectors.selectedAtlas),
    switchMap(atlas => this.sapi.getAllParcellations(atlas))
  )
  isBusy$ = new Subject<boolean>()
  
  parcellationVisibility$ = this.store$.pipe(
    select(atlasAppearance.selectors.showDelineation)
  )

  constructor(
    private dialog: MatDialog,
    private store$: Store,
    private sapi: SAPI,
    private svc: ParcellationVisibilityService,
    @Inject(DARKTHEME) public darktheme$: Observable<boolean>
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
            return this.sapi.getSupportedParcellations(selectedATP.atlas, template).pipe(
              switchMap(parcs => {
                if (parcs.find(p => p.id === selectedATP.parcellation.id)) {
                  return of({ template })
                }
                return this.#askUser(
                  null,
                  `Template **${template.name}** does not support the current parcellation **${selectedATP.parcellation.name}**. Please select one of the following parcellations:`,
                  parcs.map(p => p.name),
                  {
                    actionsAsList: true
                  }
                ).pipe(
                  map(parcname => {
                    const foundParc = parcs.find(p => p.name === parcname)
                    if (foundParc) {
                      return ({ template, requested: { parcellation: foundParc } })
                    }
                    return null
                  })
                )
              })
            )
          }
          if (parcellation) {
            return this.sapi.getSupportedTemplates(selectedATP.atlas, parcellation).pipe(
              switchMap(tmpls => {
                if (tmpls.find(t => t.id === selectedATP.template.id)) {
                  return of({ parcellation })
                }
                return this.#askUser(
                  null,
                  `Parcellation **${parcellation.name}** is not mapped in the current template **${selectedATP.template.name}**. Please select one of the following templates:`,
                  tmpls.map(tmpl => tmpl.name),
                  {
                    actionsAsList: true
                  }
                ).pipe(
                  map(tmplname => {
                    const foundTmpl = tmpls.find(tmpl => tmpl.name === tmplname)
                    if (foundTmpl) {
                      return ({ requested: { template: foundTmpl }, parcellation })
                    }
                    return null
                  })
                )
              })
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
        const { atlas, parcellation, template, requested } = obj
        if (atlas) {
          this.store$.dispatch(
            atlasSelection.actions.selectAtlas({ atlas })
          )
        }
        if (parcellation) {
          this.store$.dispatch(
            atlasSelection.actions.selectParcellation({ parcellation, requested })
          )
        }
        if (template) {
          this.store$.dispatch(
            atlasSelection.actions.selectTemplate({ template, requested })
          )
        }
      })
    )
  }

  private selectLeaf$ = new Subject<Partial<ATP>>()
  selectLeaf(atp: Partial<ATP>) {
    this.selectLeaf$.next(atp)
  }

  toggleParcellationVisibility() {
    this.svc.toggleVisibility()
  }

  ngOnDestroy(): void {
    while (this.#subscription.length > 0) this.#subscription.pop().unsubscribe()
  }
}
