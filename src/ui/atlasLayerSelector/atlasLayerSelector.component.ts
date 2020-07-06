import { Component, OnInit, ViewChildren, QueryList } from "@angular/core";
import { select, Store } from "@ngrx/store";
import { safeFilter } from "src/services/stateStore.service";
import { distinctUntilChanged, map, withLatestFrom, shareReplay, groupBy, mergeMap, toArray, switchMap, scan } from "rxjs/operators";
import { Observable, Subscription, from, zip, of } from "rxjs";
import { viewerStateGetSelectedAtlas, viewerStateSelectParcellationWithId, viewerStateSelectTemplateWithId } from "src/services/state/viewerState.store.helper";
import { MatMenuTrigger } from "@angular/material/menu";

@Component({
  selector: 'atlas-layer-selector',
  templateUrl: './atlasLayerSelector.template.html',
  styleUrls: ['./atlasLayerSelector.style.css'],
  exportAs: 'atlasLayerSelector'
})
export class AtlasLayerSelector implements OnInit {

    @ViewChildren(MatMenuTrigger) matMenuTriggers: QueryList<MatMenuTrigger>
    public atlas: any

    public nonGroupedLayers$: Observable<any[]>
    public groupedLayers$: Observable<any[]>

    public selectedTemplateSpaceId: string
    public selectedLayers = []

    public selectedTemplate$: Observable<any>
    private selectedParcellation$: Observable<any>
    public selectedAtlas$: Observable<any>
    private subscriptions: Subscription[] = []

    public selectorExpanded: boolean = false
    public selectedTemplatePreviewUrl: string = ''

    constructor(private store$: Store<any>) {
      this.selectedAtlas$ = this.store$.pipe(
        select(viewerStateGetSelectedAtlas),
        distinctUntilChanged(),
        shareReplay(1)
      )
      this.selectedTemplate$ = this.store$.pipe(
        select('viewerState'),
        safeFilter('templateSelected'),
        map(state => state.templateSelected),
        withLatestFrom(this.selectedAtlas$),
        map(([templateSelected, templateFromAtlas]) => {
          return {
            ...templateFromAtlas,
            ...templateSelected
          }
        })
      )
      this.selectedParcellation$ = this.store$.pipe(
        select('viewerState'),
        safeFilter('parcellationSelected'),
        map(state => state.parcellationSelected),
      )

      const layersGroupBy$ = this.selectedAtlas$.pipe(
        switchMap(selectedAtlas => from((selectedAtlas?.parcellations) || []).pipe(
          groupBy((parcellation: any) => parcellation.groupName, p => p),
          mergeMap(group => zip(
            of(group.key),
            group.pipe(toArray()))
          ),
          scan((acc, curr) => acc.concat([ curr ]), []),
          shareReplay(1),
        ))
      )

      this.nonGroupedLayers$ = layersGroupBy$.pipe(
        map(arr => {
          const nonGrouped = arr.find(([ _key ]) => !_key)
          return (nonGrouped && nonGrouped[1]) || []
        })
      )

      this.groupedLayers$ = layersGroupBy$.pipe(
        map(arr => arr
          .filter(([ key ]) => !!key )
          .map(([key, parcellations]) => ({
            name: key,
            previewUrl: parcellations[0].previewUrl,
            parcellations
          }))
        ),
      )
    }

    ngOnInit(): void {
      this.subscriptions.push(
        this.selectedTemplate$.subscribe(st => {
          this.selectedTemplatePreviewUrl = st.templateSpaces.find(t => t['@id'] === st['@id']).previewUrl
          this.selectedTemplateSpaceId = st['@id']
        }),
      )
      this.subscriptions.push(
        this.selectedParcellation$.subscribe(ps => {
          this.selectedLayers = this.atlas  && [this.atlas.parcellations.find(l => l['@id'] === ps['@id'])['@id']]
        })
      )
      this.subscriptions.push(
        this.selectedAtlas$.subscribe(sa => {
          if (sa && sa !== 'undefined') this.atlas = sa
        })
      )
    }

    selectTemplateWithName(template) {
      this.store$.dispatch(
        viewerStateSelectTemplateWithId({ payload: template })
      )
    }

    selectParcellationWithName(layer) {
      this.store$.dispatch(
        viewerStateSelectParcellationWithId({ payload: layer })
      )
    }

    currentTemplateIncludesLayer(layer) {
      return layer.availableIn.map(a => a['@id']).includes(this.selectedTemplateSpaceId)
    }

    templateIncludesGroup(group) {
      return group.parcellations.some(v => v.availableIn.map(t => t['@id']).includes(this.selectedTemplateSpaceId))
    }

    selectedOneOfTheLayers(layers) {
      const includes = layers.map(l=>l['@id']).some(id=> this.selectedLayers.includes(id))
      return includes
    }

    selectedLayersIncludes(id) {
      return this.selectedLayers.includes(id)
    }

    collapseExpandedGroup(){
      this.matMenuTriggers.forEach(t => t.menuOpen && t.closeMenu())
    }

    getTileTmplClickFnAsCtx(fn: (...arg) => void, param: any) {
      return () => fn.call(this, param)
    }
}
