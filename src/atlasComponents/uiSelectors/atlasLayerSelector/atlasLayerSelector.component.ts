import { Component, OnInit, ViewChildren, QueryList, HostBinding, ViewChild, TemplateRef, ElementRef, Pipe, PipeTransform } from "@angular/core";
import { select, Store } from "@ngrx/store";
import { distinctUntilChanged, map, withLatestFrom, shareReplay, groupBy, mergeMap, toArray, switchMap, scan, filter, tap } from "rxjs/operators";
import { Observable, Subscription, from, zip, of, combineLatest } from "rxjs";
import { viewerStateSelectTemplateWithId, viewerStateToggleLayer } from "src/services/state/viewerState.store.helper";
import { MatMenuTrigger } from "@angular/material/menu";
import { viewerStateGetSelectedAtlas, viewerStateAtlasLatestParcellationSelector, viewerStateSelectedTemplateFullInfoSelector, viewerStateSelectedTemplatePureSelector, viewerStateSelectedParcellationSelector } from "src/services/state/viewerState/selectors";
import { ARIA_LABELS, QUICKTOUR_DESC } from 'common/constants'
import { IQuickTourData } from "src/ui/quickTour/constrants";
import { animate, state, style, transition, trigger } from "@angular/animations";

@Component({
  selector: 'atlas-layer-selector',
  templateUrl: './atlasLayerSelector.template.html',
  styleUrls: ['./atlasLayerSelector.style.css'],
  exportAs: 'atlasLayerSelector',
  animations: [
    trigger('toggleAtlasLayerSelector', [
      state('false', style({
        transform: 'scale(0)',
        opacity: 0,
        transformOrigin: '0% 100%'
      })),
      state('true', style({
        transform: 'scale(1)',
        opacity: 1,
        transformOrigin: '0% 100%'
      })),
      transition('false => true', [
        animate('200ms cubic-bezier(0.35, 0, 0.25, 1)')
      ]),
      transition('true => false', [
        animate('200ms cubic-bezier(0.35, 0, 0.25, 1)')
      ])
    ])
  ],
  providers:[
    {
      provide: OVERWRITE_SHOW_DATASET_DIALOG_TOKEN,
      useValue: null
    }
  ]
})
export class AtlasLayerSelector implements OnInit {

    public TOGGLE_ATLAS_LAYER_SELECTOR = ARIA_LABELS.TOGGLE_ATLAS_LAYER_SELECTOR

    @ViewChildren(MatMenuTrigger) matMenuTriggers: QueryList<MatMenuTrigger>
    public atlas: any

    @ViewChild('selectorPanelTmpl', { read: ElementRef })
    selectorPanelTemplateRef: ElementRef

    public selectedAtlas$: Observable<any> = this.store$.pipe(
      select(viewerStateGetSelectedAtlas),
      distinctUntilChanged(),
      shareReplay(1)
    )
    private layersGroupBy$ = this.selectedAtlas$.pipe(
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


    private atlasLayersLatest$ = this.store$.pipe(
      select(viewerStateAtlasLatestParcellationSelector),
      shareReplay(1),
    )

    public nonGroupedLayers$: Observable<any[]> = this.atlasLayersLatest$.pipe(
      map(allParcellations =>
        allParcellations
          .filter(p => !p['groupName'])
          .filter(p => !p['baseLayer'])
      ),
    )

    public groupedLayers$: Observable<any[]> = combineLatest([
      this.atlasLayersLatest$.pipe(
        map(allParcellations =>
          allParcellations.filter(p => !p['baseLayer'])
        ),
      ),
      this.layersGroupBy$
    ]).pipe(
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
    public selectedTemplateSpaceId: string
    public selectedLayers = []

    public selectedTemplate$: Observable<any>
    private selectedParcellation$: Observable<any>

    private subscriptions: Subscription[] = []

    @HostBinding('attr.data-opened')
    public selectorExpanded: boolean = false
    public selectedTemplatePreviewUrl: string = ''
        
    public quickTourData: IQuickTourData = {
      order: 4,
      description: QUICKTOUR_DESC.LAYER_SELECTOR,
    }

    public availableTemplates$ = this.store$.pipe<any[]>(
      select(viewerStateSelectedTemplateFullInfoSelector),
    )

    public containerMaxWidth: number

    public shouldShowRenderPlaceHolder$ = combineLatest([
      this.availableTemplates$,
      this.groupedLayers$,
      this.nonGroupedLayers$,
    ]).pipe(
      map(([ availTmpl, grpL, ungrpL ]) => {
        return availTmpl?.length > 0 || (grpL?.length || 0) + (ungrpL?.length || 0) > 0
      })
    )

    constructor(private store$: Store<any>) {

      this.selectedTemplate$ = this.store$.pipe(
        select(viewerStateSelectedTemplatePureSelector),
        withLatestFrom(this.selectedAtlas$),
        map(([templateSelected, templateFromAtlas]) => {
          return {
            ...templateFromAtlas,
            ...templateSelected
          }
        })
      )
      this.selectedParcellation$ = this.store$.pipe(
        select(viewerStateSelectedParcellationSelector)
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

    toggleSelector() {
      this.selectorExpanded = !this.selectorExpanded
    }

    selectTemplateWithName(template) {
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
      if (!this.atlas) return
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

    trackbyAtId(t){
      return t['@id']
    }

    trackbyName(t) {
      return t['name']
    }
}

import { OVERWRITE_SHOW_DATASET_DIALOG_TOKEN } from "src/util/interfaces";

const previewImgMap = new Map([
  ['minds/core/referencespace/v1.0.0/a1655b99-82f1-420f-a3c2-fe80fd4c8588', 'bigbrain.png'],
  ['minds/core/referencespace/v1.0.0/dafcffc5-4826-4bf1-8ff6-46b8a31ff8e2', 'icbm2009c.png'],
  ['minds/core/referencespace/v1.0.0/7f39f7be-445b-47c0-9791-e971c0b6d992', 'colin27.png'],
  ['minds/core/parcellationatlas/v1.0.0/94c1125b-b87e-45e4-901c-00daee7f2579', 'cytoarchitectonic-maps.png'],
  ['juelich/iav/atlas/v1.0.0/3', 'cortical-layers.png'],
  ['juelich/iav/atlas/v1.0.0/4', 'grey-white-matter.png'],
  ['juelich/iav/atlas/v1.0.0/5', 'firbe-long.png'],
  ['juelich/iav/atlas/v1.0.0/6', 'firbe-short.png'],
  ['minds/core/parcellationatlas/v1.0.0/d80fbab2-ce7f-4901-a3a2-3c8ef8a3b721', 'difumo-64.png'],
  ['minds/core/parcellationatlas/v1.0.0/73f41e04-b7ee-4301-a828-4b298ad05ab8', 'difumo-128.png'],
  ['minds/core/parcellationatlas/v1.0.0/141d510f-0342-4f94-ace7-c97d5f160235', 'difumo-256.png'],
  ['minds/core/parcellationatlas/v1.0.0/63b5794f-79a4-4464-8dc1-b32e170f3d16', 'difumo-512.png'],
  ['minds/core/parcellationatlas/v1.0.0/12fca5c5-b02c-46ce-ab9f-f12babf4c7e1', 'difumo-1024.png'],
  ['minds/core/referencespace/v1.0.0/265d32a0-3d84-40a5-926f-bf89f68212b9', 'allen-mouse.png'],
  ['minds/core/parcellationatlas/v1.0.0/05655b58-3b6f-49db-b285-64b5a0276f83', 'allen-mouse-2017.png'],
  ['minds/core/parcellationatlas/v1.0.0/39a1384b-8413-4d27-af8d-22432225401f', 'allen-mouse-2015.png'],
  ['minds/core/referencespace/v1.0.0/d5717c4a-0fa1-46e6-918c-b8003069ade8', 'waxholm.png'],
  ['minds/core/parcellationatlas/v1.0.0/ebb923ba-b4d5-4b82-8088-fa9215c2e1fe-v4', 'waxholm-v4.png'],
  ['minds/core/parcellationatlas/v1.0.0/ebb923ba-b4d5-4b82-8088-fa9215c2e1fe', 'waxholm-v3.png'],
  ['minds/core/parcellationatlas/v1.0.0/2449a7f0-6dd0-4b5a-8f1e-aec0db03679d', 'waxholm-v2.png'],
  ['minds/core/parcellationatlas/v1.0.0/11017b35-7056-4593-baad-3934d211daba', 'waxholm-v1.png'],
  ['juelich/iav/atlas/v1.0.0/79cbeaa4ee96d5d3dfe2876e9f74b3dc3d3ffb84304fb9b965b1776563a1069c', 'short-bundle-hcp.png'],
  ['minds/core/referencespace/v1.0.0/tmp-fsaverage', 'freesurfer.png'],
  ['minds/core/referencespace/v1.0.0/tmp-fsaverage6', 'freesurfer.png'],
  ['minds/core/referencespace/v1.0.0/tmp-hcp32k', 'freesurfer.png'],
  ['minds/core/referencespace/v1.0.0/MEBRAINS_T1.masked', 'primate.png'],
  ['minds/core/parcellationatlas/v1.0.0/mebrains-tmp-id', 'primate-parc.png'],
])

/**
 * used for directories
 */
const previewNameToPngMap = new Map([
  ['fibre architecture', 'firbe-long.png'],
  ['functional modes', 'difumo-128.png']
])

@Pipe({
  name: 'getPreviewUrlPipe',
  pure: true
})

export class GetPreviewUrlPipe implements PipeTransform{
  public transform(tile: any){
    const filename = tile['@id']
      ? previewImgMap.get(tile['@id'])
      : previewNameToPngMap.get(tile['name'])
    if (!filename) {
      console.log(tile)
    }
    return filename && `assets/images//atlas-selection/${filename}`
  }
}
