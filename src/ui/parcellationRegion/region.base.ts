import { EventEmitter, Input, Output, Pipe, PipeTransform } from "@angular/core";
import { select, Store, createSelector } from "@ngrx/store";
import { uiStateOpenSidePanel, uiStateExpandSidePanel, uiActionShowSidePanelConnectivity } from 'src/services/state/uiState.store.helper'
import { distinctUntilChanged, switchMap, filter, map, tap } from "rxjs/operators";
import { Observable, BehaviorSubject, combineLatest } from "rxjs";
import { ARIA_LABELS } from 'common/constants'
import { flattenRegions, getIdFromFullId, rgbToHsl } from 'common/util'
import { viewerStateSetConnectivityRegion, viewerStateNavigateToRegion, viewerStateToggleRegionSelect, viewerStateGetSelectedAtlas } from "src/services/state/viewerState.store.helper";

export class RegionBase {

  public rgbString: string
  public rgbDarkmode: boolean

  private _region: any

  get region(){
    return this._region
  }

  @Input()
  set region(val) {
    this._region = val
    this.region$.next(this._region)
    if (!this._region) return
    if (!this._region.rgb) return
    this.rgbString = `rgb(${this._region.rgb.join(',')})`
    const [h, s, l] = rgbToHsl(...this._region.rgb)
    this.rgbDarkmode = l < 0.4
  }
  
  private region$: BehaviorSubject<any> = new BehaviorSubject(null)

  @Input()
  public isSelected: boolean = false

  @Input() public hasConnectivity: boolean

  @Output() public closeRegionMenu: EventEmitter<boolean> = new EventEmitter()

  public sameRegionTemplate: any[] = []
  public regionInOtherTemplates$: Observable<any[]>
  public regionOriginDatasetLabels$: Observable<{ name: string }[]>

  constructor(
    private store$: Store<any>,
  ) {

    this.regionInOtherTemplates$ = this.region$.pipe(
      distinctUntilChanged(),
      filter(v => !!v),
      switchMap(region => this.store$.pipe(
        select(
          regionInOtherTemplateSelector,
          { region }
        )
      ))
    )

    this.regionOriginDatasetLabels$ = combineLatest(
      this.store$,
      this.region$
    ).pipe(
      map(([state, region]) => getRegionParentParcRefSpace(state, { region })),
      map(({ template }) => (template && template.originalDatasetFormats) || [])
    )
  }


  public navigateToRegion() {
    this.closeRegionMenu.emit()
    const { region } = this
    this.store$.dispatch(
      viewerStateNavigateToRegion({ payload: { region } })
    )
  }

  public toggleRegionSelected() {
    this.closeRegionMenu.emit()
    const { region } = this
    this.store$.dispatch(
      viewerStateToggleRegionSelect({ payload: { region } })
    )
  }

  public showConnectivity(regionName) {
    this.closeRegionMenu.emit()
    // ToDo trigger side panel opening with effect
    this.store$.dispatch(uiStateOpenSidePanel())
    this.store$.dispatch(uiStateExpandSidePanel())
    this.store$.dispatch(uiActionShowSidePanelConnectivity())

    this.store$.dispatch(
      viewerStateSetConnectivityRegion({ connectivityRegion: regionName })
    )
  }

  changeView(sameRegion) {
    const {
      template,
      parcellation,
      region
    } = sameRegion
    const { position } = region
    this.closeRegionMenu.emit()

    /**
     * TODO use createAction in future
     * for now, not importing const because it breaks tests
     */
    this.store$.dispatch({
      type: `NEWVIEWER`,
      selectTemplate: template,
      selectParcellation: parcellation,
      navigation: {
        position
      },
    })
  }

  public SHOW_CONNECTIVITY_DATA = ARIA_LABELS.SHOW_CONNECTIVITY_DATA
  public SHOW_IN_OTHER_REF_SPACE = ARIA_LABELS.SHOW_IN_OTHER_REF_SPACE
  public SHOW_ORIGIN_DATASET = ARIA_LABELS.SHOW_ORIGIN_DATASET
  public AVAILABILITY_IN_OTHER_REF_SPACE = ARIA_LABELS.AVAILABILITY_IN_OTHER_REF_SPACE
}

export const getRegionParentParcRefSpace = createSelector(
  (state: any) => state.viewerState,
  viewerStateGetSelectedAtlas,
  (viewerState, selectedAtlas, prop) => {
    const { region: regionOfInterest } = prop
    /**
     * if region is undefined, return null
     */
    if (!regionOfInterest || !viewerState.parcellationSelected || !viewerState.templateSelected) {
      return {
        template: null,
        parcellation: null
      }
    }
    /**
     * first check if the region can be found in the currently selected parcellation
     */
    const checkRegions = regions => {
      for (const region of regions) {
        
        /**
         * check ROI to iterating regions
         */
        if (region.name === regionOfInterest.name) return true
        
        if (region && region.children && Array.isArray(region.children)) {
          const flag = checkRegions(region.children)
          if (flag) return true
        }
      }
      return false
    }
    const regionInParcSelected = checkRegions(viewerState.parcellationSelected.regions)

    if (regionInParcSelected) {
      const p = selectedAtlas.parcellations.find(p => p['@id'] === viewerState.parcellationSelected['@id'])
      if (p) {
        const refSpace = p.availableIn.find(refSpace => refSpace['@id'] === viewerState.templateSelected['@id'])
        return {
          template: refSpace,
          parcellation: p
        }
      }
    } 
    
    return {
      template: null,
      parcellation: null
    }
  }
)

@Pipe({
  name: 'renderViewOriginDatasetlabel'
})

export class RenderViewOriginDatasetLabelPipe implements PipeTransform{
  public transform(originDatasetlabels: { name: string }[], index: string|number){
    if (!!originDatasetlabels && !!originDatasetlabels[index] && !!originDatasetlabels[index].name) {
      return `View ${originDatasetlabels[index]['name']}`
    }
    return `View origin dataset`
  }
}

export const regionInOtherTemplateSelector = createSelector(
  (state: any) => state.viewerState,
  (viewerState, prop) => {
    const { region: regionOfInterest } = prop
    const returnArr = []
    const regionOfInterestHemisphere = regionOfInterest.name.includes('- right hemisphere')
      ? 'right hemisphere'
      : regionOfInterest.name.includes('- left hemisphere')
        ? 'left hemisphere'
        : null

    const regionOfInterestId = getIdFromFullId(regionOfInterest.fullId)
    const { fetchedTemplates, templateSelected } = viewerState
    const selectedTemplateId = getIdFromFullId(templateSelected.fullId)
    const otherTemplates = fetchedTemplates.filter(({ fullId }) => getIdFromFullId(fullId) !== selectedTemplateId)
    for (const template of otherTemplates) {
      for (const parcellation of template.parcellations) {
        const flattenedRegions = flattenRegions(parcellation.regions)
        const selectableRegions = flattenedRegions.filter(({ labelIndex }) => !!labelIndex)

        for (const region of selectableRegions) {
          const id = getIdFromFullId(region.fullId)
          if (!!id) {
            const regionHemisphere = region.name.includes('- right hemisphere')
              ? 'right hemisphere'
              : region.name.includes('- left hemisphere')
                ? 'left hemisphere'
                : null
            
            if (id === regionOfInterestId) {
              /**
               * if both hemisphere metadatas are defined
               */
              if (
                !!regionOfInterestHemisphere &&
                !!regionHemisphere
              ) {
                if (regionHemisphere === regionOfInterestHemisphere) {
                  returnArr.push({
                    template,
                    parcellation,
                    region,
                  })
                }
              } else {
                returnArr.push({
                  template,
                  parcellation,
                  region,
                  hemisphere: regionHemisphere
                })
              }
            }
          }
        }
      }
    }
    return returnArr
  }
)