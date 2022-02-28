import { Directive, EventEmitter, Input, Output, Pipe, PipeTransform } from "@angular/core";
import { select, Store } from "@ngrx/store";
import { Observable, BehaviorSubject } from "rxjs";
import { rgbToHsl, hexToRgb } from 'common/util'
import { strToRgb, verifyPositionArg } from 'common/util'
import { actions } from "src/state/atlasSelection";
import { SapiAtlasModel, SapiParcellationModel, SapiRegionModel, SapiSpaceModel } from "../sapi";
import { atlasSelection } from "src/state";

@Directive()
export class RegionBase {

  public rgbString: string
  public rgbDarkmode: boolean

  private _region: SapiRegionModel

  private _position: number[]
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

  public dois: string[] = []

  @Input('region-menu-atlas')
  atlas: SapiAtlasModel

  @Input('region-menu-parcellation')
  parcellation: SapiParcellationModel

  @Input('region-menu-template')
  template: SapiSpaceModel

  @Input('region-menu-region')
  set region(val) {
    this._region = val
    this.region$.next(this._region)
    this.hasContext$.next(false)

    this.position = null
    // bug the centroid returned is currently nonsense
    // this.position = val?.props?.centroid_mm
    if (!val) return
    const pos = val?.hasAnnotation?.bestViewPoint?.coordinates?.map(v => v.value * 1e6)
    if (pos) {
      this.position = pos
    }

    let rgb = [255, 200, 200]
    if (val.hasAnnotation?.displayColor) {
      rgb = hexToRgb(val?.hasAnnotation?.displayColor)
    } else {
      rgb = strToRgb(JSON.stringify(val))
    }
    this.rgbString = `rgb(${rgb.join(',')})`
    const [_h, _s, l] = rgbToHsl(...rgb)
    this.rgbDarkmode = l < 0.4

    this.dois = (val.hasAnnotation?.inspiredBy || [])
      .map(insp => insp["@id"] as string)
      .filter(id => /^https?:\/\/doi\.org/.test(id))
  }

  get region(){
    return this._region
  }


  public hasContext$: BehaviorSubject<boolean> = new BehaviorSubject(false)
  public region$: BehaviorSubject<any> = new BehaviorSubject(null)

  @Input()
  public isSelected: boolean = false

  @Input() public hasConnectivity: boolean

  @Output() public closeRegionMenu: EventEmitter<boolean> = new EventEmitter()

  public selectedAtlas$: Observable<any> = this.store$.pipe(
    select(atlasSelection.selectors.selectedAtlas)
  )


  constructor(
    private store$: Store<any>,
  ) {

  }

  public selectedTemplate$ = this.store$.pipe(
    select(atlasSelection.selectors.selectedTemplate),
  )

  public navigateToRegion() {
    this.closeRegionMenu.emit()
    const { region } = this
    this.store$.dispatch(
      atlasSelection.actions.navigateToRegion({
        region
      })
    )
  }

  public toggleRegionSelected() {
    this.closeRegionMenu.emit()
    const { region } = this
    this.store$.dispatch(
      actions.toggleRegionSelect({
        region
      })
    )
  }

  public showConnectivity(regionName) {
    this.closeRegionMenu.emit()
    // ToDo trigger side panel opening with effect
    // this.store$.dispatch(uiStateOpenSidePanel())
    // this.store$.dispatch(uiStateExpandSidePanel())
    // this.store$.dispatch(uiActionShowSidePanelConnectivity())

    // I think we can use viewerMode for this??
    // this.store$.dispatch(
    //   viewerStateSetConnectivityRegion({ connectivityRegion: regionName })
    // )
  }

  changeView(template: SapiSpaceModel) {

    this.closeRegionMenu.emit()
    this.store$.dispatch(
      atlasSelection.actions.viewSelRegionInNewSpace({
        region: this._region,
        template,
      })
    )
  }
}

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
