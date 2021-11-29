import { Directive, EventEmitter, Input, Output, Pipe, PipeTransform } from "@angular/core";
import { select, Store, createSelector } from "@ngrx/store";
import { uiStateOpenSidePanel, uiStateExpandSidePanel, uiActionShowSidePanelConnectivity } from 'src/services/state/uiState.store.helper'
import { map, tap } from "rxjs/operators";
import { Observable, BehaviorSubject, combineLatest } from "rxjs";
import { rgbToHsl } from 'common/util'
import { viewerStateSetConnectivityRegion, viewerStateNavigateToRegion, viewerStateToggleRegionSelect, viewerStateSelectTemplateWithId } from "src/services/state/viewerState.store.helper";
import { viewerStateGetSelectedAtlas, viewerStateSelectedTemplatePureSelector } from "src/services/state/viewerState/selectors";
import { strToRgb, verifyPositionArg } from 'common/util'
import { getPosFromRegion } from "src/util/siibraApiConstants/fn";
import { TRegionDetail } from "src/util/siibraApiConstants/types";
import { IHasId } from "src/util/interfaces";
import { TSiibraExTemplate } from "./type";

@Directive()
export class RegionBase {

  public rgbString: string
  public rgbDarkmode: boolean

  private _region: TRegionDetail & {  
    context?: {
      atlas: IHasId
      template: IHasId
      parcellation: IHasId
    }
    ngId?: string
  }

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
    this.hasContext$.next(!!this._region?.context)

    this.position = null
    // bug the centroid returned is currently nonsense
    // this.position = val?.props?.centroid_mm
    if (!this._region) return
    const pos = getPosFromRegion(val)
    if (pos) {
      this.position = pos
    }

    const rgb = this._region.rgb
      || (this._region.labelIndex > 65500 && [255, 255, 255])
      || strToRgb(`${this._region.ngId || this._region.name}${this._region.labelIndex}`)
      || [255, 200, 200]

    this.rgbString = `rgb(${rgb.join(',')})`
    const [_h, _s, l] = rgbToHsl(...rgb)
    this.rgbDarkmode = l < 0.4
  }

  get region(){
    return this._region
  }

  get originDatainfos(){
    if (!this._region) return []
    return (this._region._dataset_specs || []).filter(spec => spec['@type'] === 'minds/core/dataset/v1.0.0')
  }

  public hasContext$: BehaviorSubject<boolean> = new BehaviorSubject(false)
  public region$: BehaviorSubject<any> = new BehaviorSubject(null)

  @Input()
  public isSelected: boolean = false

  @Input() public hasConnectivity: boolean

  @Output() public closeRegionMenu: EventEmitter<boolean> = new EventEmitter()

  public regionOriginDatasetLabels$: Observable<{ name: string }[]>
  public selectedAtlas$: Observable<any> = this.store$.pipe(
    select(viewerStateGetSelectedAtlas)
  )


  constructor(
    private store$: Store<any>,
  ) {

    this.regionOriginDatasetLabels$ = combineLatest([
      this.store$,
      this.region$
    ]).pipe(
      map(([state, region]) => getRegionParentParcRefSpace(state, { region })),
      map(({ template }) => (template && template.originalDatasetFormats) || [])
    )
  }

  public selectedTemplate$ = this.store$.pipe(
    select(viewerStateSelectedTemplatePureSelector),
  )

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

  changeView(template: TSiibraExTemplate) {

    this.closeRegionMenu.emit()

    const {
      parcellation
    } = (this.region?.context || {})
    
    /**
     * TODO use createAction in future
     * for now, not importing const because it breaks tests
     */
    this.store$.dispatch(
      viewerStateSelectTemplateWithId({
        payload: {
          '@id': template['@id'] || template['fullId']
        },
        config: {
          selectParcellation: {
            '@id': parcellation['@id'] || parcellation['fullId']
          }
        }
      })
    )
  }
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
