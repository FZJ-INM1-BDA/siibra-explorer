import { Component, OnInit, ViewChildren, QueryList } from "@angular/core";
import { select, Store } from "@ngrx/store";
import { safeFilter } from "src/services/stateStore.service";
import { distinctUntilChanged, map, withLatestFrom, shareReplay, groupBy, mergeMap, toArray, switchMap, scan, tap, filter } from "rxjs/operators";
import { Observable, Subscription, from, zip, of, combineLatest } from "rxjs";
import { viewerStateGetSelectedAtlas, viewerStateSelectTemplateWithId, viewerStateAllParcellationsSelector, viewerStateToggleLayer } from "src/services/state/viewerState.store.helper";
import { MatMenuTrigger } from "@angular/material/menu";
import {CLEAR_CONNECTIVITY_REGION, SET_CONNECTIVITY_VISIBLE} from "src/services/state/viewerState.store";

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

    public availableTemplates$: Observable<any[]>

    public containerMaxWidth: number

    constructor(private store$: Store<any>) {
      this.selectedAtlas$ = this.store$.pipe(
        select(viewerStateGetSelectedAtlas),
        distinctUntilChanged(),
        shareReplay(1)
      )

      this.availableTemplates$ = combineLatest(
        this.selectedAtlas$.pipe(
          filter(v => !!v)
        ),
        this.store$.pipe(
          select('viewerState'),
          select('fetchedTemplates')
        )
      ).pipe(
        map(([ { templateSpaces }, fetchedTemplates ]) => {
          return templateSpaces.map(templateSpace => {
            const fullTemplateInfo = fetchedTemplates.find(t => t['@id'] === templateSpace['@id'])
            return {
              ...templateSpace,
              ...(fullTemplateInfo || {}),
              darktheme: (fullTemplateInfo || {}).useTheme === 'dark'
            }
          })
        }),
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
          /**
           * do not show base layers
           */
          filter(p => !(p as any).baseLayer),
          groupBy((parcellation: any) => parcellation.groupName, p => p),
          mergeMap(group => zip(
            of(group.key),
            group.pipe(toArray()))
          ),
          scan((acc, curr) => acc.concat([ curr ]), []),
          shareReplay(1),
        ))
      )

      this.nonGroupedLayers$ = combineLatest(
        this.store$.pipe(
          select(viewerStateAllParcellationsSelector)
        ),
        layersGroupBy$
      ).pipe(
        map(([ allParcellations, arr]) => {
          const nonGrouped = arr.find(([ _key ]) => !_key)
          return ((nonGrouped && nonGrouped[1]) || []).map(layer => {
            const fullLayerInfo = allParcellations.find(p => p['@id'] === layer['@id']) || {}
            return {
              ...fullLayerInfo,
              ...layer,
              darktheme: (fullLayerInfo || {}).useTheme === 'dark'
            }
          })
        }),
      )

      this.groupedLayers$ = combineLatest(
        this.store$.pipe(
          select(viewerStateAllParcellationsSelector)
        ),
        layersGroupBy$
      ).pipe(
        map(([ allParcellations, arr]) => arr
          .filter(([ key ]) => !!key )
          .map(([key, parcellations]) => ({
            name: key,
            previewUrl: parcellations[0].previewUrl,
            parcellations: parcellations.map(p => {
              const fullInfo = allParcellations.find(fullP => fullP['@id'] === p['@id']) || {}
              return {
                ...fullInfo,
                ...p,
                darktheme: (fullInfo || {}).useTheme === 'dark'
              }
            })
          }))
        ),
      )
    }

    ngOnInit(): void {
      this.subscriptions.push(
        this.selectedTemplate$.subscribe(st => {
          this.selectedTemplatePreviewUrl = st.templateSpaces?.find(t => t['@id'] === st['@id']).previewUrl
          this.selectedTemplateSpaceId = st['@id']
        }),
      )
      this.subscriptions.push(
        this.selectedParcellation$.subscribe(ps => {
          this.selectedLayers = (this.atlas && [this.atlas.parcellations.find(l => l['@id'] === ps['@id'])['@id']]) || []
        })
      )
      this.subscriptions.push(
        this.selectedAtlas$.subscribe(sa => {
          this.atlas = sa
        })
      )
    }

    selectTemplateWithName(template) {
      this.store$.dispatch({type: CLEAR_CONNECTIVITY_REGION})
      this.store$.dispatch({type: SET_CONNECTIVITY_VISIBLE, payload: null})
      this.store$.dispatch(
        viewerStateSelectTemplateWithId({ payload: template })
      )
    }

    selectParcellationWithName(layer) {
      const templateChangeRequired = !this.currentTemplateIncludesLayer(layer)
      if (!templateChangeRequired) {
        this.store$.dispatch(
          viewerStateToggleLayer({ payload: layer })
        )
      } else {
        this.store$.dispatch(
          viewerStateSelectTemplateWithId({ payload: layer.availableIn[0], config: { selectParcellation: layer } })
        )
      }
    }

    currentTemplateIncludesLayer(layer) {
      return layer && layer.availableIn.map(a => a['@id']).includes(this.selectedTemplateSpaceId)
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

    getTooltipText(layer) {
      if (this.atlas.templateSpaces.map(tmpl => tmpl['@id']).includes(layer['@id'])) return layer.name
      if (layer.availableIn) {
        if (this.currentTemplateIncludesLayer(layer)) return layer.name
        else {
          const firstAvailableRefSpaceId = layer && Array.isArray(layer.availableIn) && layer.availableIn.length > 0 && layer.availableIn[0]['@id']
          const firstAvailableRefSpace = firstAvailableRefSpaceId && this.atlas.templateSpaces.find(t => t['@id'] === firstAvailableRefSpaceId)
          return `${layer.name} 🔄 ${(firstAvailableRefSpace && firstAvailableRefSpace.name) || ''}`
        }
      }

      if (layer.parcellations) {
        if (this.templateIncludesGroup(layer)) return layer.name
        else return `${layer.name} 🔄`
      }
      
      return layer.name
    }
}
