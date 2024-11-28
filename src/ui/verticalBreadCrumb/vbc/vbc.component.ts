import { ChangeDetectionStrategy, Component, Inject } from "@angular/core";
import { select, Store } from "@ngrx/store";
import { combineLatest, of } from "rxjs";
import { map, switchMap, take } from "rxjs/operators";
import { SAPI } from "src/atlasComponents/sapi";
import { SxplrAtlas, SxplrParcellation, SxplrRegion, SxplrTemplate } from "src/atlasComponents/sapi/sxplrTypes";
import { FilterGroupedParcellationPipe, GroupedParcellation } from "src/atlasComponents/sapiViews/core/parcellation";
import { atlasSelection } from "src/state";
import { NEHUBA_CONFIG_SERVICE_TOKEN, NehubaConfigSvc } from "src/viewerModule/nehuba/config.service";

const pipe = new FilterGroupedParcellationPipe()

@Component({
  selector: 'sxplr-vertical-bread-crumb',
  templateUrl: './vbc.template.html',
  styleUrls: [
    './vbc.style.scss'
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class VerticalBreadCrumbComponent {
  #selectedATP$ = this.store$.pipe(
    atlasSelection.fromRootStore.distinctATP()
  )
  #selectedRegions$ = this.store$.pipe(
    select(atlasSelection.selectors.selectedRegions)
  )
  #allAtlases$ = this.sapi.atlases$
  
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

  #spaceStates$ = combineLatest([
    this.store$.pipe(
      select(atlasSelection.selectors.currentViewport)
    )
  ]).pipe(
    map(([ currentViewport ]) => {
      return {
        currentViewport
      }
    })
  )

  #parcStates$ = combineLatest([
    this.store$.pipe(
      select(atlasSelection.selectors.selectedParcAllRegions)
    ),
    // current labelled map
    this.#selectedATP$.pipe(
      switchMap(
        ({ template, parcellation }) => template && parcellation
        ? this.sapi.getLabelledMap(parcellation, template)
        : of(null)
      )
    )
  ]).pipe(
    map(([ allAvailableRegions, currentMap ]) => {
      const labelMappedRegionNames = currentMap && Object.keys(currentMap.indices) || []
      return {
        allAvailableRegions,
        labelMappedRegionNames,
      }
    })
  )

  view$ = combineLatest([
    this.#selectedATP$,
    this.#selectedRegions$,
    this.#allAtlases$,
    this.#atlasStates$,
    this.#parcStates$,
    this.#spaceStates$,
  ]).pipe(
    map(([selectedATP, selectedRegions, atlases, {noGroupParcs, groupParcs, templates, parcellations }, {allAvailableRegions, labelMappedRegionNames}, { currentViewport }]) => {
      
      return {
        selectedATP, selectedRegions, templates, parcellations, atlases, noGroupParcs, groupParcs, allAvailableRegions, labelMappedRegionNames, currentViewport
      }
    })
  )
  
  constructor(
    private store$: Store,
    private sapi: SAPI,
    @Inject(NEHUBA_CONFIG_SERVICE_TOKEN) private nehubaConfigSvc: NehubaConfigSvc,
  ){
    
  }
  public async resetNavigation({rotation: rotationFlag = false, position: positionFlag = false, zoom : zoomFlag = false}: {rotation?: boolean, position?: boolean, zoom?: boolean}) {

    const { template } = await this.#selectedATP$.pipe(
      take(1)
    ).toPromise()

    const config = this.nehubaConfigSvc.getNehubaConfig(template)

    const currentNavigation = await this.store$.pipe(
      select(atlasSelection.selectors.navigation),
      take(1)
    ).toPromise()
    const {
      zoomFactor: zoom
    } = config.dataset.initialNgState.navigation

    this.store$.dispatch(
      atlasSelection.actions.navigateTo({
        navigation: {
          ...currentNavigation,
          ...(rotationFlag ? { orientation: [0, 0, 0, 1] } : {}),
          ...(positionFlag ? { position: [0, 0, 0] } : {}),
          ...(zoomFlag ? { zoom: zoom } : {}),
        },
        physical: true,
        animation: true
      })
    )
  }


  public clearRoi() {
    this.store$.dispatch(
      atlasSelection.actions.clearSelectedRegions()
    )
  }

  public selectRoi(roi: SxplrRegion) {
    this.store$.dispatch(
      atlasSelection.actions.selectRegion({
        region: roi
      })
    )
  }

  public toggleRoi(roi: SxplrRegion) {
    this.store$.dispatch(
      atlasSelection.actions.toggleRegion({
        region: roi
      })
    )
  }

  public async selectATP(type: string, id: string, regionId?: string) {
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

  public getSubParcellation(obj: GroupedParcellation): SxplrParcellation[] {
    return obj.parcellations
  }

  public selectTemplateByName(name: string, availableTemplates: SxplrTemplate[]) {
    const selectTemplate = availableTemplates.find(t => t.name === name)
    if (selectTemplate) {
      this.selectATP('templateId', selectTemplate.id)
    }
  }

  public navigateTo(position: number[]){
    this.store$.dispatch(
      atlasSelection.actions.navigateTo({
        navigation: {
          position: position.map(v => v * 1e6),
        },
        animation: true,
        physical: true
      })
    )
  }

  public isActive<T extends SxplrAtlas|SxplrTemplate|SxplrParcellation>(current: T) {
    return (name: string) => {
      return name === current.name
    }
  }
}
