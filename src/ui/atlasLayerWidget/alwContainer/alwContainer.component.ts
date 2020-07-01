import { Component } from "@angular/core";
import { Store, select } from "@ngrx/store";
import { Observable, combineLatest } from "rxjs";
import { viewerStateGetOverlayingAdditionalParcellations, viewerStateGetSelectedAtlas, viewerStateToggleAdditionalLayer, viewerStateRemoveAdditionalLayer } from 'src/services/state/viewerState.store.helper'
import { map, shareReplay, withLatestFrom, filter, tap } from "rxjs/operators";

@Component({
  selector: 'atlas-layer-container',
  templateUrl: './alwContainer.template.html',
  styleUrls: [
    './alwContainer.style.css'
  ]
})

export class AtlasLayerContainer {

  public poiIsBaseLayer: boolean

  public templateSelected$: Observable<any>
  public parcellationOfInterest$: Observable<any>
  
  public availableDatasets: number 

  private overlayingParcellationLayers$: Observable<any[]>
  private parcellationSelected$: Observable<any>

  public visibleTab: 'dataset' | 'connectivity' | 'hierarchy'

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
  }

  handleClickWidget(type: 'dataset' | 'connectivity' | 'hierarchy'){
    if (type !== this.visibleTab) this.visibleTab = type
    else this.visibleTab = null
  }

  toggleLayer(atlas) {
    this.store$.dispatch(
      viewerStateToggleAdditionalLayer({ atlas })
    )
  }

  removeNonBaseLayer(atlas) {
    this.store$.dispatch(
      viewerStateRemoveAdditionalLayer({ atlas })
    )
  }
}
