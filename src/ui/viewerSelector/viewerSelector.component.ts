import { Component, ElementRef, OnInit, ViewChild, ViewChildren, QueryList } from "@angular/core";
import { select, Store } from "@ngrx/store";
import { safeFilter } from "src/services/stateStore.service";
import { distinctUntilChanged, map, withLatestFrom, shareReplay } from "rxjs/operators";
import { Observable, Subscription } from "rxjs";
import { viewerStateGetSelectedAtlas, viewerStateSelectParcellationWithId, viewerStateSelectTemplateWithId } from "src/services/state/viewerState.store.helper";
import { MatMenuTrigger } from "@angular/material/menu";

@Component({
  selector: 'viewer-selector',
  templateUrl: './viewerSelector.template.html',
  styleUrls: ['./viewerSelector.style.css'],
})
export class ViewerSelectorComponent implements OnInit {

    @ViewChildren(MatMenuTrigger) matMenuTriggers: QueryList<MatMenuTrigger>
    public atlas: any

    public groupedLayers = []

    public selectedTemplateSpaceIndex: number = 0
    public selectedLayers = []

    public selectedTemplate$: Observable<any>
    private selectedParcellation$: Observable<any>
    public selectedAtlas$: Observable<any>
    private subscriptions: Subscription[] = []

    public layerGroupMenuItems: any[]

    public selectorExpanded: boolean = false

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
    }

    ngOnInit(): void {
      this.subscriptions.push(
        this.selectedTemplate$.subscribe(st => {
          this.selectedTemplateSpaceIndex = this.atlas && this.atlas.templateSpaces.findIndex(ts => ts['@id'] === st['@id'])
        })
      )
      this.subscriptions.push(
        this.selectedParcellation$.subscribe(ps => {
          this.selectedLayers = this.atlas  && [this.atlas.parcellations.find(l => l['@id'] === ps['@id'])['@id']]
        })
      )
      this.subscriptions.push(
        this.selectedAtlas$.subscribe(sa => {
          if (sa && sa !== 'undefined') this.atlas = sa

          const groupableParcellations = this.atlas?.parcellations.filter(p => p.groupName && p.groupName.length)

          const groupsDict = groupableParcellations.reduce((r, a) => {
            r[a.groupName] = r[a.groupName] || []
            r[a.groupName].push(a)
            return r
          }, {})
          this.groupedLayers = Object.entries(groupsDict)
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

    templateIncludesLayer(layer, template) {
      return layer.availableIn.map(a => a['@id']).includes(template['@id'])
    }

    templateIncludesGroup(group, template) {
      return group[1].every(v => v.availableIn.map(t => t['@id']).includes(template['@id']))
    }

    selectedOneOfTheLayers(layers) {
      const includes = layers.map(l=>l['@id']).some(r=> this.selectedLayers.includes(r))
      return includes
    }

    selectedLayersIncludes(id) {
      return this.selectedLayers.includes(id)
    }

    notGroupedParcellations(parcellations) {
      return parcellations.filter(p => !p.groupName)
    }

    collapseExpandedGroup(){
      this.matMenuTriggers.forEach(t => t.menuOpen && t.closeMenu())
    }
}
