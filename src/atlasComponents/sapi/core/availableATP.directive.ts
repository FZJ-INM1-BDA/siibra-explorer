import { Directive } from "@angular/core";
import { SAPI } from "../sapi.service";
import { select, Store } from "@ngrx/store";
import { combineLatest } from "rxjs";
import { map, switchMap, take } from "rxjs/operators";
import { atlasSelection } from "src/state";
import { FilterGroupedParcellationPipe } from "src/atlasComponents/sapiViews/core/parcellation";

const pipe = new FilterGroupedParcellationPipe()

@Directive({
  selector: '[available-atp]',
  standalone: true,
  exportAs: 'availableATP'
})

export class AvailableATPDirective {
  #atlases$ = this.sapi.atlases$
  
  #selectedATP$ = this.store$.pipe(
    atlasSelection.fromRootStore.distinctATP()
  )

  #atlasStates$ = combineLatest([
    this.store$.pipe(
      select(atlasSelection.selectors.selectedAtlas),
      switchMap(atlas => this.sapi.getAllParcellations(atlas))
    ),
    this.store$.pipe(
      select(atlasSelection.selectors.selectedAtlas),
      switchMap(atlas => this.sapi.getAllSpaces(atlas))
    ),
  ]).pipe(
    map(([ parcellations, templates ]) => {
      const noGroupParcs = pipe.transform(parcellations || [], false)
      const groupParcs = pipe.transform(parcellations || [], true)
      
      return {
        noGroupParcs, groupParcs, templates, parcellations
      }
    })
  )

  view$ = combineLatest([
    this.#atlases$,
    this.#atlasStates$,
    this.#selectedATP$
  ]).pipe(
    map(([ atlases, { noGroupParcs, groupParcs, templates, parcellations }, selectedATP ]) => ({ atlases, noGroupParcs, groupParcs, templates, parcellations, selectedATP }))
  )

  constructor(
    private sapi: SAPI,
    private store$: Store
  ){

  }

  async selectATP(type: "atlasId" | "templateId" | "parcellationId", id: string, regionId?: string) {
    if (!['atlasId', 'parcellationId', 'templateId'].includes(type)) {
      console.warn(`type must be of type 'atlasId' | 'parcellationId' | 'templateId'`)
      return 
    }
    if (!id) {
      console.warn(`id must be defined`)
      return
    }

    const { selectedATP, parcellations, templates } = await this.view$.pipe(
      take(1)
    ).toPromise()

    const config: {
      autoSelect: boolean
      messages: {
        parcellation?: string
        template?: string
      }
    } = {
      autoSelect: false,
      messages: {}
    }
    if (type === "atlasId") {
      config.autoSelect = true
    }
    if (type === "templateId") {
      const wantedTemplate = templates.find(t => t.id === id)
      config.messages.parcellation = `Current parcellation **${selectedATP?.parcellation?.name}** is not mapped in the selected template **${wantedTemplate?.name}**. Please select one of the following parcellations:`
    }
    if (type === "parcellationId") {
      const wantedParcellation = parcellations.find(p => p.id === id)
      config.messages.template = `Selected parcellation **${wantedParcellation?.name}** is not mapped in the current template **${selectedATP?.template?.name}**. Please select one of the following templates:`
    }
    this.store$.dispatch(
      atlasSelection.actions.selectATPById({
        [type]: id,
        regionId,
        config,
      })
    )
  }
}
