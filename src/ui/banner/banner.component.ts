import { Component, HostBinding } from "@angular/core";
import { Store, select } from "@ngrx/store";
import { ViewerStateInterface, safeFilter, SELECT_PARCELLATION, extractLabelIdx, SELECT_REGIONS, NEWVIEWER } from "../../services/stateStore.service";
import { Observable } from "rxjs";
import { map, filter } from "rxjs/operators";

@Component({
  selector : 'atlas-banner',
  templateUrl : './banner.template.html',
  styleUrls : [
    `./banner.style.css`
  ]
})

export class AtlasBanner{

  public loadedTemplates$ : Observable<any[]>
  public selectedTemplate$ : Observable<any>
  public selectedParcellation$ : Observable<any>
  public selectedRegions$ : Observable<any[]>

  private regionsLabelIndexMap : Map<number,any> = new Map()

  public selectedTemplate : any
  public selectedParcellation : any
  public selectedRegions : any[] = []

  searchTerm : string = ''

  constructor(private store:Store<ViewerStateInterface>){
    this.loadedTemplates$ = this.store.pipe(
      select('viewerState'),
      safeFilter('fetchedTemplates'),
      map(state=>state.fetchedTemplates))

    this.selectedTemplate$ = this.store.pipe(
      select('newViewer'),
      filter(state=>typeof state !== 'undefined')
    )

    this.selectedParcellation$ = this.store.pipe(
      select('viewerState'),
      safeFilter('parcellationSelected'),
      map(state=>state.parcellationSelected)
    )

    this.selectedRegions$ = this.store.pipe(
      select('viewerState'),
      safeFilter('regionsSelected'),
      map(state=>state.regionsSelected)
    )

    this.selectedTemplate$.subscribe((state)=>{
      this.selectedTemplate = state.templateSelected
      this.handleParcellationChange(state.parcellationSelected)
    })
    this.selectedParcellation$.subscribe(this.handleParcellationChange)
    this.selectedRegions$.subscribe((ev)=>{
      this.selectedRegions = ev
    })
  }

  private handleParcellationChange(parcellation){
    this.selectedParcellation = parcellation
    this.mapRegions(parcellation.regions)
  }

  selectTemplate(template:any){
    if(this.selectedTemplate === template){
      return
    }

    /* hmm, is this right? */
    this.store.dispatch({
      type : NEWVIEWER,
      selectTemplate : template,
      selectParcellation : template.parcellations[0]
    })
  }

  handleClickRegion(region:any){
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
    return typeof item.labelIndex !== 'undefined' && this.selectedRegions.findIndex(re=>re.labelIndex === item.labelIndex) >= 0 ? 
      `<span class = "regionSelected">${item.name}</span>` :
      `<span class = "regionNotSelected">${item.name}</span>`
  }

  private mapRegions(regions:any[]){
    regions.forEach((region:any)=>{
      if(region.labelIndex){
        this.regionsLabelIndexMap.set(region.labelIndex,region)
      }
      if(region.children){
        this.mapRegions(region.children)
      }
    })
  }

  get treeHeaderText():string{
    return ''
  }

  clearRegions(event:Event){
    event.stopPropagation()
    event.preventDefault()
    this.store.dispatch({
      type : SELECT_REGIONS,
      selectRegions : []
    })
  }
}