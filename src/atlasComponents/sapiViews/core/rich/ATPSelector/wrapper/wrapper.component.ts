import { Component, EventEmitter, Inject, OnDestroy, Output } from "@angular/core";
import { MatDialog } from "src/sharedModules/angularMaterial.exports";
import { select, Store } from "@ngrx/store";
import { Observable, Subject, Subscription } from "rxjs";
import { switchMap, withLatestFrom } from "rxjs/operators";
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

@Component({
  selector: 'sxplr-wrapper-atp-selector',
  templateUrl: './wrapper.template.html',
  styleUrls: [
    `./wrapper.style.css`
  ]
})

export class WrapperATPSelector implements OnDestroy{

  @Output('sxplr-wrapper-atp-selector-menu-open')
  menuOpen = new EventEmitter<{some: boolean, all: boolean, none: boolean}>()

  darkThemePalette = darkThemePalette
  lightThemePalette = lightThemePalette

  #subscription: Subscription[] = []

  #askUser(title: string, titleMd: string, descMd: string, actions: string[], config?: Partial<AskUserConfig>): Observable<string> {
    return this.dialog.open(DialogFallbackCmp, {
      data: {
        title,
        titleMd,
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

  // TODO how do we check busy'ness?
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
        withLatestFrom(this.selectedATP$),
      ).subscribe(([{ template, parcellation, atlas }, selectedATP]) => {

        this.store$.dispatch(
          atlasSelection.actions.selectATPById({
            templateId: template?.id,
            parcellationId: parcellation?.id,
            atlasId: atlas?.id,
            config: {
              autoSelect: !!atlas,
              messages: {
                parcellation: `Current parcellation **${selectedATP?.parcellation?.name}** is not mapped in the selected template **${template?.name}**. Please select one of the following parcellations:`,
                template: `Selected parcellation **${parcellation?.name}** is not mapped in the current template **${selectedATP?.template?.name}**. Please select one of the following templates:`,
              }
            }
          })
        )
      }),
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
