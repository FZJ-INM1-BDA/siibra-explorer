import { EventEmitter, Input, Output, Pipe, PipeTransform } from "@angular/core";
import { select, Store, createSelector } from "@ngrx/store";
import { uiStateOpenSidePanel, uiStateExpandSidePanel, uiActionShowSidePanelConnectivity } from 'src/services/state/uiState.store.helper'
import { distinctUntilChanged, switchMap, filter, map, withLatestFrom } from "rxjs/operators";
import { Observable, BehaviorSubject, combineLatest } from "rxjs";
import { ARIA_LABELS } from 'common/constants'
import { flattenRegions, getIdFromFullId, rgbToHsl } from 'common/util'
import { viewerStateSetConnectivityRegion, viewerStateNavigateToRegion, viewerStateToggleRegionSelect, viewerStateNewViewer, isNewerThan } from "src/services/state/viewerState.store.helper";
import { viewerStateFetchedTemplatesSelector, viewerStateGetSelectedAtlas, viewerStateSelectedTemplateFullInfoSelector, viewerStateSelectedTemplateSelector } from "src/services/state/viewerState/selectors";
import { intToRgb, verifyPositionArg, getRegionHemisphere } from 'common/util'

export class RegionBase {

  public rgbString: string
  public rgbDarkmode: boolean

  private _region: any

  private _position: [number, number, number]
  set position(val){
    if (verifyPositionArg(val)) {
      this._position = val
    } else {
      this._position = null
    }
  }

  get position(){
    return this._position
  }

  @Input()
  set region(val) {
    this._region = val
    this.region$.next(this._region)
    this.position = val && val.position
    if (!this._region) return

    const rgb = this._region.rgb || (this._region.labelIndex && intToRgb(Number(this._region.labelIndex))) || [255, 200, 200]
    this.rgbString = `rgb(${rgb.join(',')})`
    const [_h, _s, l] = rgbToHsl(...rgb)
    this.rgbDarkmode = l < 0.4
  }

  get region(){
    return this._region
  }
  
  private region$: BehaviorSubject<any> = new BehaviorSubject(null)

  @Input()
  public isSelected: boolean = false

  @Input() public hasConnectivity: boolean

  @Output() public closeRegionMenu: EventEmitter<boolean> = new EventEmitter()

  public sameRegionTemplate: any[] = []
  public regionInOtherTemplates$: Observable<any[]>
  public regionOriginDatasetLabels$: Observable<{ name: string }[]>
  public selectedAtlas$: Observable<any> = this.store$.pipe(
    select(viewerStateGetSelectedAtlas)
  )

  public selectedTemplateFullInfo$: Observable<any[]>

  constructor(
    private store$: Store<any>,
  ) {

    this.selectedTemplateFullInfo$ = this.store$.pipe(
      select(viewerStateSelectedTemplateFullInfoSelector),
    )

    this.regionInOtherTemplates$ = this.region$.pipe(
      distinctUntilChanged(),
      filter(v => !!v),
      switchMap(region => this.store$.pipe(
        select(
          regionInOtherTemplateSelector,
          { region }
        ),
        withLatestFrom(
          this.store$.pipe(
            select(viewerStateGetSelectedAtlas)
          )
        ),
        map(([ regionsInOtherTemplates, selectedatlas ]) => {
          const { parcellations } = selectedatlas
          const filteredRsInOtherTmpls = []
          for (const bundledObj of regionsInOtherTemplates) {
            const { template, parcellation, region } = bundledObj

            /**
             * trying to find duplicate region
             * with same templateId, and same hemisphere
             */
            const sameEntityIdx = filteredRsInOtherTmpls.findIndex(({ template: _template, region: _region }) => {
              return _template['@id'] === template['@id']
                && getRegionHemisphere(_region) === getRegionHemisphere(region)
            })
            /**
             * if doesn't exist, just push to output
             */
            if ( sameEntityIdx < 0 ) {
              filteredRsInOtherTmpls.push(bundledObj)
            } else {

              /**
               * if exists, only append the latest version
               */
              const { parcellation: currentParc } = filteredRsInOtherTmpls[sameEntityIdx]
              /**
               * if the new element is newer than existing item
               */
              if (isNewerThan(parcellations, parcellation, currentParc)) {
                filteredRsInOtherTmpls.splice(sameEntityIdx, 1)
                filteredRsInOtherTmpls.push(bundledObj)
              }
            }
          }
          return filteredRsInOtherTmpls
        })
      ))
    )

    this.regionOriginDatasetLabels$ = combineLatest([
      this.store$,
      this.region$
    ]).pipe(
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
    const navigation = Array.isArray(position) && position.length === 3
      ? { position }
      : {  }
    this.closeRegionMenu.emit()

    /**
     * TODO use createAction in future
     * for now, not importing const because it breaks tests
     */
    this.store$.dispatch(viewerStateNewViewer ({
      selectTemplate: template,
      selectParcellation: parcellation,
      navigation,
    }))
  }

  public GO_TO_REGION_CENTROID = ARIA_LABELS.GO_TO_REGION_CENTROID
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
      return `${originDatasetlabels[index]['name']}`
    }
    return `origin dataset`
  }
}

export const regionInOtherTemplateSelector = createSelector(
  viewerStateGetSelectedAtlas,
  viewerStateFetchedTemplatesSelector,
  viewerStateSelectedTemplateSelector,
  (atlas, fetchedTemplates, templateSelected, prop) => {
    const atlasTemplateSpacesIds = atlas.templateSpaces.map(({ ['@id']: id, fullId }) => id || fullId)
    const { region: regionOfInterest } = prop
    const returnArr = []

    const regionOfInterestHemisphere = getRegionHemisphere(regionOfInterest)

    const regionOfInterestId = getIdFromFullId(regionOfInterest.fullId)
    if (!templateSelected) return []
    const selectedTemplateId = getIdFromFullId(templateSelected.fullId)

    // need to ensure that the templates are defined in atlas definition
    // atlas is the single source of truth 
    
    const otherTemplates = fetchedTemplates
      .filter(({ fullId }) => getIdFromFullId(fullId) !== selectedTemplateId)
      .filter(({ ['@id']: id, fullId }) => atlasTemplateSpacesIds.includes(id || fullId))
    for (const template of otherTemplates) {
      for (const parcellation of template.parcellations) {
        const flattenedRegions = flattenRegions(parcellation.regions)
        const selectableRegions = flattenedRegions.filter(({ labelIndex }) => !!labelIndex)

        for (const region of selectableRegions) {
          const id = getIdFromFullId(region.fullId)
          if (!!id && id === regionOfInterestId) {
            const regionHemisphere = getRegionHemisphere(region)
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
    return returnArr
  }
)
