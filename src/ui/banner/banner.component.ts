import { Component, OnDestroy } from "@angular/core";
import { Store, select } from "@ngrx/store";
import { ViewerStateInterface, safeFilter, SELECT_PARCELLATION, extractLabelIdx, SELECT_REGIONS, NEWVIEWER, getLabelIndexMap, isDefined } from "../../services/stateStore.service";
import { Observable, Subscription, merge } from "rxjs";
import { map, filter } from "rxjs/operators";
import { FilterNameBySearch } from "../../util/pipes/filterNameBySearch.pipe";

@Component({
  selector : 'atlas-banner',
  templateUrl : './banner.template.html',
  styleUrls : [
    `./banner.style.css`
  ]
})

export class AtlasBanner implements OnDestroy{

  public loadedTemplates$ : Observable<any[]>
  public newViewer$ : Observable<any>
  public selectedParcellation$ : Observable<any>
  public selectedRegions$ : Observable<any[]>

  private regionsLabelIndexMap : Map<number,any> = new Map()

  public selectedTemplate : any
  public selectedParcellation : any
  public selectedRegions : any[] = []

  private subscriptions : Subscription[] = []

  searchTerm : string = ''

  constructor(private store:Store<ViewerStateInterface>){
    this.loadedTemplates$ = this.store.pipe(
      select('viewerState'),
      safeFilter('fetchedTemplates'),
      map(state=>state.fetchedTemplates))

    this.newViewer$ = this.store.pipe(
      select('viewerState'),
      filter(state=>isDefined(state) && isDefined(state.templateSelected)),
      filter(state=>
        !isDefined(this.selectedTemplate) || 
        state.templateSelected.name !== this.selectedTemplate.name) 
    )

    this.selectedParcellation$ = this.store.pipe(
      select('viewerState'),
      safeFilter('parcellationSelected'),
      map(state=>state.parcellationSelected)
    )

    this.selectedRegions$ = merge(
      this.store.pipe(
        select('viewerState'),
        filter(state=>isDefined(state)&&isDefined(state.regionsSelected)),
        map(state=>state.regionsSelected)
      )
    ) 
    this.subscriptions.push(
      this.newViewer$.subscribe((state)=>{
        
        this.selectedTemplate = state.templateSelected
        const selectedParcellation = state.parcellationSelected ? state.parcellationSelected : this.selectedTemplate.parcellations[0]
        this.handleParcellationChange(selectedParcellation)
      })
    )
    this.subscriptions.push(
      this.selectedParcellation$.subscribe((this.handleParcellationChange).bind(this))
    )
    this.subscriptions.push(
      this.selectedRegions$.subscribe((ev)=>{
        this.selectedRegions = ev
      })
    )
  }

  ngOnDestroy(){
    this.subscriptions.forEach(s=>s.unsubscribe())
  }

  handleParcellationChange(parcellation){
    // const selectedParcellation = this.selectedTemplate.parcellations.find(p=>p.ngId === parcellation.ngId)
    this.selectedParcellation = parcellation
    this.regionsLabelIndexMap = getLabelIndexMap(parcellation.regions)
  }

  selectTemplate(template:any){
    if(this.selectedTemplate === template){
      return
    }

    this.store.dispatch({
      type : NEWVIEWER,
      selectTemplate : template,
      selectParcellation : template.parcellations[0]
    })
  }

  selectParcellation(parcellation:any){
    this.store.dispatch({
      type : SELECT_PARCELLATION,
      selectParcellation : parcellation
    })
  }

  handleClickRegion(obj:any){
    const region = obj.inputItem
    const selectedSet = new Set(extractLabelIdx(region))
    const intersection = new Set([...this.selectedRegions.map(r=>r.labelIndex)].filter(v=>selectedSet.has(v)))
    this.store.dispatch({
      type : SELECT_REGIONS,
      selectRegions : intersection.size > 0 ? 
        this.selectedRegions.filter(v=>!intersection.has(v.labelIndex)) :
        this.selectedRegions.concat([...selectedSet].map(idx=>this.regionsLabelIndexMap.get(idx)))
    })
  }

  displayActiveTemplate(template:any){
    return `<small>Template</small> <small class = "mute-text">${template ? '(' + template.name + ')' : ''}</small> <span class = "caret"></span>`
  }

  displayActiveParcellation(parcellation:any){
    return `<small>Parcellation</small> <small class = "mute-text">${parcellation ? '(' + parcellation.name + ')' : ''}</small> <span class = "caret"></span>`
  }

  displayTreeNode(item:any){
    return typeof item.labelIndex !== 'undefined' && this.selectedRegions.findIndex(re=>re.labelIndex === Number(item.labelIndex)) >= 0 ? 
      `<span class = "regionSelected">${item.name}</span>` :
      `<span class = "regionNotSelected">${item.name}</span>`
  }

  get treeHeaderText():string{
    return ''
  }

  getChildren(item:any){
    return item.children
  }

  filterTreeBySearch(node:any):boolean{
    return this.filterNameBySearchPipe.transform([node.name],this.searchTerm)
  }

  clearRegions(event:Event){
    event.stopPropagation()
    event.preventDefault()
    this.store.dispatch({
      type : SELECT_REGIONS,
      selectRegions : []
    })
  }

  filterNameBySearchPipe = new FilterNameBySearch()
}