import { ChangeDetectionStrategy, Component, EventEmitter, inject, Inject, Input, Optional, Output, ViewChild } from "@angular/core";
import { select, Store } from "@ngrx/store";
import { combineLatest, merge, Observable, of, Subject } from "rxjs";
import { debounceTime, distinctUntilChanged, filter, map, startWith, switchMap, take, takeUntil, withLatestFrom } from "rxjs/operators";
import { SAPI, IDS } from "src/atlasComponents/sapi";
import { Feature, SxplrParcellation, SxplrRegion, SxplrTemplate } from "src/atlasComponents/sapi/sxplrTypes";
import { FilterGroupedParcellationPipe, GroupedParcellation } from "src/atlasComponents/sapiViews/core/parcellation";
import { atlasAppearance, atlasSelection, userInteraction, userPreference } from "src/state";
import { NEHUBA_CONFIG_SERVICE_TOKEN, NehubaConfigSvc } from "src/viewerModule/nehuba/config.service";
import { enLabels } from "src/uiLabels"
import { FormControl, FormGroup } from "@angular/forms";
import { geometryEqual, getUuid } from "src/util/fn";
import { DestroyDirective } from "src/util/directives/destroy.directive";
import { DoiTemplate } from "src/ui/doi/doi.component"
import { translateRegionName } from "src/atlasComponents/sapi/translateV3";
import { generalActionError } from "src/state/actions";
import { MatExpansionPanel } from "@angular/material/expansion";
import { arrayEqual } from "src/util/array";
import { LABEL_EVENT_TRIGGER, SXPLR_PREFIX, LABEL_EVENT } from "src/util/constants";
import { ModularUserAnnotationToolService } from "src/atlasComponents/userAnnotations/tools/service";
import { IAnnotationGeometry } from "src/atlasComponents/userAnnotations/tools/type";
import { BANLIST_CONNECTIVITY, EXPERIMENTAL_CONNECTIVITY, WHITELIST_CONNECTIVITY } from "src/features/connectivity";
import { ViewerMode } from "src/state/atlasSelection/const";
import { MM_ID, QV_T, SANDS_TYPE } from "src/util/types";

const pipe = new FilterGroupedParcellationPipe()


type PasteTarget = "pos"|"zoom"|"rot"
type NavigationState = {
  x: number
  y: number
  z: number

  zoom: number

  rotx: number
  roty: number
  rotz: number
  rotw: number
}

function validateNumbers(input: (number|null|undefined)[]): input is number[]{
  return input.every(v => !Number.isNaN(v) && !!v || v === 0)
}

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
  
  SXPLR_PREFIX = SXPLR_PREFIX

  IDS = IDS

  @Output()
  show = new EventEmitter()

  @Input()
  viewerLoaded: boolean = false

  @ViewChild('parcExpPanel')
  private parcExpPanel: MatExpansionPanel
  @ViewChild('selPtExpPanel')
  private ptAsgmtExpPanel: MatExpansionPanel
  @ViewChild('selFtExpPanel')
  private featExpPanel: MatExpansionPanel
  @ViewChild('selRegExpPanel')
  private regExpPanel: MatExpansionPanel

  DoiTemplate = DoiTemplate

  #destroy$ = inject(DestroyDirective).destroyed$
  
  #pasted$ = new Subject<{target: PasteTarget, value: string}>()
  
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

  public navigationCtlForm = new FormGroup({
    x: new FormControl<string>('0'),
    y: new FormControl<string>('0'),
    z: new FormControl<string>('0'),
    
    zoom: new FormControl<string>('1'),

    rotx: new FormControl<string>('0'),
    roty: new FormControl<string>('0'),
    rotz: new FormControl<string>('0'),
    rotw: new FormControl<string>('1'),
  })
  
  onPaste(ev: ClipboardEvent, target: PasteTarget="pos") {
    const text = ev.clipboardData.getData('text/plain')
    this.#pasted$.next({ target, value: text})
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

  #userSelected$ = combineLatest([
    this.store$.pipe(
      select(userInteraction.selectors.selectedFeature),
    ),
    this.store$.pipe(
      select(atlasSelection.selectors.selectedPoint),
    ),
    this.store$.pipe(
      select(atlasAppearance.selectors.customLayers),
      map(layers => layers.filter(l => l.clType === "customlayer/nglayer" && !l.id?.startsWith(SXPLR_PREFIX)) as atlasAppearance.const.NgLayerCustomLayer[]),
      distinctUntilChanged(arrayEqual((o, n) => o.id === n.id)),
    )
  ]).pipe(
    map(([ selectedFeature, selectedPoint, customLayers ]) => {
      return { selectedFeature, selectedPoint, customLayers }
    })
  )

  userSelection$ = combineLatest([
    this.#selectedATP$,
    this.#selectedRegions$,
    this.#atlasStates$,
    this.#parcStates$,
    this.#spaceStates$,
    this.#userSelected$,
  ]).pipe(
    map(([selectedATP, selectedRegions, {noGroupParcs, groupParcs, templates, parcellations }, {allAvailableRegions, labelMappedRegionNames}, { currentViewport }, { selectedFeature, selectedPoint, customLayers}]) => {
      
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
        selectedPoint,
        customLayers,
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
  private atlasSelection$ = combineLatest([
    this.store$.pipe(
      select(atlasSelection.selectors.navigation),
      map(nav => nav?.zoom || 1),
      distinctUntilChanged(),
    )
  ]).pipe(
    map(([ zoom ]) => {
      return { zoom }
    })
  )

  userPreferences$ = combineLatest([
    of(enLabels),
    this.store$.pipe(
      select(userPreference.selectors.showExperimental)
    ),
    this.store$.pipe(
      select(atlasAppearance.selectors.showDelineation)
    ),
  ]).pipe(
    map(([ labels, showExperimental, parcellationVisible ]) => {
      return {
        labels,
        showExperimental,
        parcellationVisible,
      }
    })
  )

  #annots$ = combineLatest([
    this.annotSvc.spaceFilteredManagedAnnotations$.pipe(
      startWith([] as IAnnotationGeometry[])
    ),
    this.annotSvc.otherSpaceManagedAnnotations$.pipe(
      startWith([] as IAnnotationGeometry[])
    ),
  ]).pipe(
    map(([ inAnnot, outAnnot ]) => ({
      inAnnot, outAnnot
    }))
  )

  view$ = combineLatest([
    this.#allAtlases$,
    this.userSelection$,
    this.userSelectionDeducedState$,
    this.userPreferences$,
    this.atlasSelection$,
    this.#annots$,
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
        selectedPoint,
        customLayers,
      },
      { useViewer },
      { labels, showExperimental, parcellationVisible, },
      { zoom },
      { inAnnot, outAnnot }]) => {
      
      const parentIds = new Set(allAvailableRegions.flatMap(v => v.parentIds))
      const { atlas, template, parcellation } = selectedATP
      const enableRegionalConnectivity = (
        WHITELIST_CONNECTIVITY.SPECIES.includes(atlas?.species)
        && !BANLIST_CONNECTIVITY.SPECIES.includes(atlas?.species)
        && selectedRegions.length === 1
        && (
          (
            WHITELIST_CONNECTIVITY.SPACE.includes(template?.id) && !BANLIST_CONNECTIVITY.SPACE.includes(template?.id)
          ) || (
            WHITELIST_CONNECTIVITY.PARCELLATION.includes(parcellation?.id) && !BANLIST_CONNECTIVITY.PARCELLATION.includes(parcellation?.id)
          )
        )
        && (
          (
            WHITELIST_CONNECTIVITY.SPACE.includes(template?.id) && !BANLIST_CONNECTIVITY.SPACE.includes(template?.id)
          ) || (
            WHITELIST_CONNECTIVITY.PARCELLATION.includes(parcellation?.id) && !BANLIST_CONNECTIVITY.PARCELLATION.includes(parcellation?.id)
          ) || (
            showExperimental && EXPERIMENTAL_CONNECTIVITY.PARCELLATION.includes(parcellation?.id)
          )
        )
      )
      const isVolumetric = template && template.id !== IDS.TEMPLATES.FSAVERAGE
      return {
        selectedATP, selectedRegions, templates, parcellations, atlases, noGroupParcs, groupParcs, allAvailableRegions, labelMappedRegionNames, currentViewport, selectedFeature, selectedPoint, labels, useViewer, parcellationVisible, showExperimental, customLayers,
        useAccordion: true, 
        leafRegions: allAvailableRegions.filter(r => !parentIds.has(r.id)),
        branchRegions: allAvailableRegions.filter(r => parentIds.has(r.id)),
        debug: false,
        zoom,
        inAnnot, outAnnot,
        enableRegionalConnectivity,
        isVolumetric,
        eventLabels: LABEL_EVENT,
      }
    })
  )
  
  constructor(
    private store$: Store,
    private sapi: SAPI,
    private annotSvc: ModularUserAnnotationToolService,
    @Inject(NEHUBA_CONFIG_SERVICE_TOKEN) private nehubaConfigSvc: NehubaConfigSvc,
    @Optional()
    @Inject(LABEL_EVENT_TRIGGER) private labelEventTrigger: (labels: string[]) => void
  ){
    
    const navStateFromState$: Observable<NavigationState> = this.store$.pipe(
      select(atlasSelection.selectors.navigation),
      filter(v => !!v),
      map(({ position, orientation, zoom }) => {
        const [x, y, z] = position.map(v => Number((v/1e6).toFixed(3)))
        const [rotx, roty, rotz, rotw] = orientation
        return {
          x, y, z,
          zoom,
          rotx, roty, rotz, rotw
        }  
      }),
    )

    const navStateFromPaste$: Observable<Partial<NavigationState>> = this.#pasted$.pipe(
      filter(({ value }) => !!value),
      map(({ value, target }) => {
        // TODO perhaps handle copy past full state (e.g. pos, zoom and rot?)
        if (target === "pos") {
          const [x, y, z] = this.#parseString(value)
          return {
            x, y, z
          }
        }
        if (target === "rot") {
          const [ rotx, roty, rotz, rotw ] = this.#parseString(value)
          return {
            rotx, roty, rotz, rotw
          }
        }
        return {}
      })
    )
    merge(
      navStateFromState$,
      navStateFromPaste$,
    ).pipe(
      debounceTime(16),
      takeUntil(this.#destroy$)
    ).subscribe(({ x, y, z, zoom, rotx, roty, rotz, rotw }) => {
      let state: Partial<Record<keyof NavigationState, string>> = {}
      if (validateNumbers([x, y, z])) {
        state = {
          ...state,
          x: `${x}`,
          y: `${y}`,
          z: `${z}`, 
        }
      }
      if (zoom && validateNumbers([zoom])) {
        state = {
          ...state,
          zoom: `${zoom}`
        }
      }
      if (validateNumbers([rotx, roty, rotz, rotw])) {
        state = {
          ...state,
          rotx: `${rotx}`,
          roty: `${roty}`,
          rotz: `${rotz}`,
          rotw: `${rotw}`,
        }
      }
      this.navigationCtlForm.patchValue(state)
    })

    this.#selectedRegions$.pipe(
      takeUntil(this.#destroy$),
      debounceTime(160),
      map(regions => regions.map(r => r.name).join("")),
      distinctUntilChanged(),
    ).subscribe(() => {
      if (this.labelEventTrigger) {
        this.labelEventTrigger([LABEL_EVENT.atlasSelection])
      }
    })
    
    this.navigationCtlForm.valueChanges.pipe(
      takeUntil(this.#destroy$),
      debounceTime(500),
      withLatestFrom(navStateFromState$),
      filter(([ newState, oldState ]) => {
        for (const stateKey in newState) {
          if (newState[stateKey] !== oldState[stateKey].toString()) {
            return true
          }
        }
        return false
      }),
      map(([ newState, _oldState ]) => newState),
    ).subscribe(({ x, y, z, zoom, rotx, roty, rotz, rotw }) => {
      this.store$.dispatch(
        atlasSelection.actions.navigateTo({
          navigation: {
            zoom: Number(zoom),
            position: [x, y, z].map(v => Number(v) * 1e6),
            orientation: [rotx, roty, rotz, rotw].map(v => Number(v)),
          },
          animation: true,
          physical: true
        })
      )
    })

    merge(
      this.view$.pipe(
        map(v => v.selectedPoint),
        debounceTime(160),
        distinctUntilChanged(geometryEqual),
        map(() => this.ptAsgmtExpPanel),
        filter(v => !!v),
      ),
      this.view$.pipe(
        map(v => v.selectedFeature),
        debounceTime(160),
        distinctUntilChanged((o, n) => o?.id === n?.id),
        map(() => this.featExpPanel),
        filter(v => !!v),
      ),
    ).pipe(
      takeUntil(this.#destroy$)
    ).subscribe(panel => {
      panel.open()
    })

    this.#selectedRegions$.pipe(
      takeUntil(this.#destroy$),
      debounceTime(160),
      distinctUntilChanged(arrayEqual((o, n) => o.name === n.name)),
      filter(regions => regions.length > 0)
    ).subscribe(() => {
      this.show.emit({})
      if (this.regExpPanel) {
        this.regExpPanel.open()
      }
    })

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
    } = config.dataset.initialNgState.navigation as any

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

  public async handleClickRegionName(name: string, toggleFlag: boolean = false){
    const regionName = translateRegionName(name)
    const regions = await this.store$.pipe(
      select(atlasSelection.selectors.selectedParcAllRegions),
      take(1)
    ).toPromise()

    const foundRegion = regions.find(r => r.name === regionName)
    if (!foundRegion) {
      this.store$.dispatch(
        generalActionError({
          message: `Region with name ${regionName} not found.`
        })
      )
      return
    }
    if (toggleFlag) {
      this.toggleRoi(foundRegion)
    } else {
      this.selectRoi(foundRegion)
    }
    
    if (this.parcExpPanel) {
      this.parcExpPanel.open()
    }
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

  public gotoNewestParc(){
    this.store$.dispatch(
      atlasSelection.actions.gotoNewestParc()
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

  public assignPoint(position: number[], template: SxplrTemplate) {
    this.store$.dispatch(
      atlasSelection.actions.selectPoint({
        point: {
          "@type": SANDS_TYPE,
          "@id": getUuid(),
          coordinateSpace: {
            "@id": template.id
          },
          coordinates: position.map(v => ({
            "@id": getUuid(),
            "@type": QV_T,
            unit: {
              "@id": MM_ID,
            },
            value: v * 1e6,
            uncertainty: [0, 0]
          }))
        }
      })
    )
  }


  public selectFeature(feature: Feature){
    this.store$.dispatch(
      userInteraction.actions.showFeature({
        feature
      })
    )
  }

  public toggleParcellationVisibility(){
    this.store$.dispatch(
      atlasAppearance.actions.toggleParcDelineation()
    )
  }

  public goToViewerMode(viewerMode: ViewerMode){
    this.store$.dispatch(
      atlasSelection.actions.setViewerMode({
        viewerMode
      })
    )
  }
}
