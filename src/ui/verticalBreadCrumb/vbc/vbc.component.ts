import { ChangeDetectionStrategy, Component, inject, Inject, Optional } from "@angular/core";
import { select, Store } from "@ngrx/store";
import { BehaviorSubject, combineLatest, merge, of, Subject } from "rxjs";
import { debounceTime, filter, map, shareReplay, switchMap, take, takeUntil } from "rxjs/operators";
import { SAPI } from "src/atlasComponents/sapi";
import { SxplrAtlas, SxplrParcellation, SxplrRegion, SxplrTemplate } from "src/atlasComponents/sapi/sxplrTypes";
import { FilterGroupedParcellationPipe, GroupedParcellation } from "src/atlasComponents/sapiViews/core/parcellation";
import { atlasAppearance, atlasSelection, userInteraction, userPreference } from "src/state";
import { NEHUBA_CONFIG_SERVICE_TOKEN, NehubaConfigSvc } from "src/viewerModule/nehuba/config.service";
import { enLabels } from "src/uiLabels"
import { FormControl, FormGroup } from "@angular/forms";
import { getUuid } from "src/util/fn";
import { DestroyDirective } from "src/util/directives/destroy.directive";
import { ParcellationVisibilityService } from "src/atlasComponents/sapiViews/core/parcellation/parcellationVis.service";
import { DoiTemplate } from "src/ui/doi/doi.component"


const pipe = new FilterGroupedParcellationPipe()

@Component({
  selector: 'sxplr-vertical-bread-crumb',
  templateUrl: './vbc.template.html',
  styleUrls: [
    './vbc.style.scss'
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    DestroyDirective
  ],
})

export class VerticalBreadCrumbComponent {

  DoiTemplate = DoiTemplate

  #destroy$ = inject(DestroyDirective).destroyed$
  
  #pasted$ = new Subject<string>()
  #minimizedCards$ = new BehaviorSubject<string[]>([])
  
  #parseString(input: string): number[]{
    return input
      .split(/[\s|,]+/)
      .map(v => {
        if (/mm$/.test(v)) {
          return v.replace(/mm$/, "")
        }
        return v
      })
      .map(Number)
  }

  public dialogForm = new FormGroup({
    x: new FormControl<string>('0'),
    y: new FormControl<string>('0'),
    z: new FormControl<string>('0'),
  })
  
  public readonly dialogInputState$ = this.dialogForm.valueChanges.pipe(
    shareReplay(1),
    map(({ x, y, z }) => {
      const allEntries = [x, y, z].map(v => this.#parseString(v))
      return {
        validated: allEntries.every(entry =>
          (
            entry.length === 1
            && !Number.isNaN(entry[0])
          )
        ),
        valueMm: allEntries.map(entry => entry[0]),
        valueNm: allEntries.map(entry => entry[0]).map(v => v*1e6),
        string: allEntries.map(entry => `${entry[0]}mm`).join(", "),
      }
    }),
  )
  
  onPaste(ev: ClipboardEvent) {
    const text = ev.clipboardData.getData('text/plain')
    this.#pasted$.next(text)
  }
  
  public async selectPoint(posNm: number[]) {
    
    const { template } = await this.#selectedATP$.pipe(
      take(1)
    ).toPromise()

    this.store$.dispatch(
      atlasSelection.actions.selectPoint({
        point: {
          "@type": "https://openminds.ebrains.eu/sands/CoordinatePoint",
          "@id": getUuid(),
          coordinateSpace: {
            "@id": template.id
          },
          coordinates: posNm.map(v => ({
            "@id": getUuid(),
            "@type": "https://openminds.ebrains.eu/core/QuantitativeValue",
            unit: {
              "@id": "id.link/mm"
            },
            value: v,
            uncertainty: [0, 0]
          }))
        }
      })
    )
    this.store$.dispatch(
      atlasSelection.actions.navigateTo({
        navigation: {
          position: posNm
        },
        physical: true,
        animation: true
      })
    )
  }

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

  userSelection$ = combineLatest([
    this.#selectedATP$,
    this.#selectedRegions$,
    this.#atlasStates$,
    this.#parcStates$,
    this.#spaceStates$,
    this.store$.pipe(
      select(userInteraction.selectors.selectedFeature)
    ),
  ]).pipe(
    map(([selectedATP, selectedRegions, {noGroupParcs, groupParcs, templates, parcellations }, {allAvailableRegions, labelMappedRegionNames}, { currentViewport }, selectedFeature]) => {
      
      return {
        selectedATP,
        selectedRegions,
        noGroupParcs,
        groupParcs,
        templates,
        parcellations,
        allAvailableRegions,
        labelMappedRegionNames,
        currentViewport,
        selectedFeature,
      }
    })
  )

  userSelectionDeducedState$ = combineLatest([
    this.store$.pipe(
      select(atlasAppearance.selectors.useViewer),
      map(useviewer => {
        if (useviewer === "NEHUBA") return "nehuba" as const
        if (useviewer === "THREESURFER") return "threeSurfer" as const
        if (useviewer === "NOT_SUPPORTED") return "notsupported" as const
        return null
      })
    )
  ]).pipe(
    map(([ useViewer ]) => {
      return {
        useViewer
      }
    })
  )

  userPreferences$ = combineLatest([
    of(enLabels),
    this.store$.pipe(
      select(userPreference.selectors.showExperimental)
    ),
    this.#minimizedCards$,
    this.svc?.visibility$ || of(null as boolean|null)
  ]).pipe(
    map(([ labels, showExperimental, minimizedCards, parcellationVisible ]) => {
      return {
        labels,
        showExperimental,
        minimizedCards,
        parcellationVisible
      }
    })
  )

  view$ = combineLatest([
    this.#allAtlases$,
    this.userSelection$,
    this.userSelectionDeducedState$,
    this.userPreferences$
  ]).pipe(
    map(([
      atlases,
      {
        selectedATP,
        selectedRegions,
        noGroupParcs,
        groupParcs,
        templates,
        parcellations,
        allAvailableRegions,
        labelMappedRegionNames,
        currentViewport,
        selectedFeature,
      },
      { useViewer },
      { labels, showExperimental, minimizedCards, parcellationVisible }]) => {
      
      return {
        selectedATP, selectedRegions, templates, parcellations, atlases, noGroupParcs, groupParcs, allAvailableRegions, labelMappedRegionNames, currentViewport, selectedFeature, labels, minimizedCards, useViewer, parcellationVisible, showExperimental
      }
    })
  )
  
  constructor(
    private store$: Store,
    private sapi: SAPI,
    @Inject(NEHUBA_CONFIG_SERVICE_TOKEN) private nehubaConfigSvc: NehubaConfigSvc,
    @Optional() @Inject(ParcellationVisibilityService) private svc: ParcellationVisibilityService,
  ){

    const navFromState$ = this.store$.pipe(
      select(atlasSelection.selectors.navigation),
      filter(v => !!v),
      map(({ position }) => position.map(v => Number((v/1e6).toFixed(3)))),
    )

    const navFromPaste$ = this.#pasted$.pipe(
      filter(v => !!v), // '' is falsy, so filters out null, undefined, '' etc
      map(v => this.#parseString(v)),
    )

    merge(
      navFromState$,
      navFromPaste$,
    ).pipe(
      filter(fullEntry => !!fullEntry && fullEntry.every(entry => !Number.isNaN(entry))),
      debounceTime(160),
      takeUntil(this.#destroy$),
    ).subscribe(fullEntry => {
      this.dialogForm.setValue({
        x: `${fullEntry[0]}`,
        y: `${fullEntry[1]}`,
        z: `${fullEntry[2]}`,
      })
    })

    this.dialogInputState$.pipe(
      takeUntil(this.#destroy$)
    ).subscribe()
    
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

  /**
   * Navigate to position (in mm)
   */
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

  public minimizeCard(cardname: string){
    const s = new Set(this.#minimizedCards$.value)
    s.add(cardname)
    this.#minimizedCards$.next(Array.from(s))
  }

  public openCard(cardname: string){
    const s = new Set(this.#minimizedCards$.value)
    s.delete(cardname)
    this.#minimizedCards$.next(Array.from(s))
  }

  public clearFeature(){
    this.store$.dispatch(
      userInteraction.actions.clearShownFeature()
    )
  }

  public toggleParcellationVisibility(){
    this.svc && this.svc.toggleVisibility()
  }
}
