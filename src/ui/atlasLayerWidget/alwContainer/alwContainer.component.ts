import { Component } from "@angular/core";
import { Store, select } from "@ngrx/store";
import { Observable, combineLatest } from "rxjs";
import { viewerStateGetOverlayingAdditionalParcellations, viewerStateRemoveAdditionalLayer, viewerStateToggleRegionSelect, viewerStateNavigateToRegion, viewerStateSelectedRegionsSelector } from 'src/services/state/viewerState.store.helper'
import { map, shareReplay, withLatestFrom, filter} from "rxjs/operators";
import {safeFilter} from "src/services/stateStore.service";

@Component({
  selector: 'atlas-layer-container',
  templateUrl: './alwContainer.template.html',
  styleUrls: [
    './alwContainer.style.css'
  ],
  exportAs: 'atlasLayerWidgetContainer'
})

export class AtlasLayerContainer {

  public poiIsBaseLayer: boolean

  public templateSelected$: Observable<any>
  public parcellationOfInterest$: Observable<any>
  
  public availableDatasets: number 
  public connectedRegionsNumber: number

  private overlayingParcellationLayers$: Observable<any[]>
  private parcellationSelected$: Observable<any>

  public visibleTab: 'dataset' | 'connectivity' | 'hierarchy'

  public connectivityRegion$: Observable<any>

  public regionsSelected$: Observable<any>

  constructor(
    private store$: Store<any>
  ){
    this.templateSelected$ = this.store$.pipe(
      select('viewerState'),
      select('templateSelected'),
      shareReplay(1)
    )

    this.overlayingParcellationLayers$ = this.store$.pipe(
      select(viewerStateGetOverlayingAdditionalParcellations),
      filter(v => !!v),
      withLatestFrom(this.templateSelected$),
      map(([ additionalP, templateSelected ]) => {
        return additionalP
          .map(ap => templateSelected?.parcellations.find(p => p['@id'] === ap['@id']))
          .filter(v => !!v)
      })
    )

    this.parcellationSelected$ = this.store$.pipe(
      select('viewerState'),
      select('parcellationSelected')
    )

    this.regionsSelected$ = this.store$.pipe(
      select(viewerStateSelectedRegionsSelector)
    )

    /**
     * added layer if defined, or else use default parcellation
     */
    this.parcellationOfInterest$ = combineLatest(
      this.overlayingParcellationLayers$.pipe(
        map(l => l.length > 0 ? l[0] : null)
      ),
      this.parcellationSelected$
    ).pipe(
      map(([ firstOverlayingLayer, parcellationSelected ]) => {
        this.poiIsBaseLayer = !firstOverlayingLayer
        return firstOverlayingLayer || parcellationSelected
      })
    )

    this.connectivityRegion$ = this.store$.pipe(
      select('viewerState'),
      safeFilter('connectivityRegion'),
      map(state => state.connectivityRegion),
    )
  }

  handleClickWidget(type: 'dataset' | 'connectivity' | 'hierarchy'){
    if (type !== this.visibleTab) this.visibleTab = type
    else this.visibleTab = null
  }

  handleRegionClick({ mode, region }){
    if (mode === 'single')  {
      this.store$.dispatch(
        viewerStateToggleRegionSelect({ payload: { region } })
      )
    }

    if (mode === 'double') {
      this.store$.dispatch(
        viewerStateNavigateToRegion({ payload: { region } })
      )
    }
  }

  removeNonBaseLayer(layer) {
    this.store$.dispatch(
      viewerStateRemoveAdditionalLayer({ payload: layer })
    )
  }
}
