import { Component, ChangeDetectionStrategy } from "@angular/core";
import { Store, select } from "@ngrx/store";
import { DataStateInterface, Property, safeFilter, DataEntry, File, SELECT_REGIONS } from "../../services/stateStore.service";
import { map, filter } from "rxjs/operators";
import { PathToNestedChildren, HasPathProperty } from "../../util/pipes/pathToNestedChildren.pipe";
import { CopyPropertyPipe } from "../../util/pipes/copyProperty.pipe";
import { TreeComponent } from "../../components/tree/tree.component";

@Component({
  selector : 'data-browser',
  templateUrl : './databrowser.template.html',
  styleUrls : [
    `./databrowser.style.css`
  ]
})

export class DataBrowserUI{

  hitsPerPage : number = 15
  currentPage :  number = 0

  selectedRegions : any[] = []

  metadataMap : Map<string,Map<string,{properties:Property}>>
  dataEntries : DataEntry[] = []
  hideDataTypes : Set<string> = new Set()

  private regionsLabelIndexMap : Map<number,any> = new Map()

  constructor(private store : Store<DataStateInterface>){

    this.store.pipe(
      select('viewerState'),
      safeFilter('regionsSelected'),
      map(state=>state.regionsSelected)
    )
      .subscribe(rs=>this.selectedRegions = rs)

    /* TODO may need to unsubscribe later */
    this.store.pipe(
      select('dataStore'),
      safeFilter('fetchedMetadataMap'),
      map(v=>v.fetchedMetadataMap)
    )
      .subscribe(map=>this.metadataMap = map)

    /* TODO may need to unsubscribe later */
    this.store.pipe(
      select('dataStore'),
      safeFilter('fetchedDataEntries'),
      map(v=>v.fetchedDataEntries)
    )
      .subscribe(arr=>(this.dataEntries = arr,this.TEMP()))

    /* TODO may need to unsubscribe later */
    this.store.pipe(
      select('newViewer'),
      filter(state=>typeof state !== 'undefined')
    )
      .subscribe(data=>
        this.handleParcellationSelection(data.parcellationSelected.regions))

    this.store.pipe(
      select('viewerState'),
      safeFilter('parcellationSelected')
    )
      .subscribe(parcellation=>
        this.handleParcellationSelection(parcellation.regions))
  }

  regions : any[] = []

  handleParcellationSelection(regions:any[]){
    this.mapRegions(regions)
    this.regions = Array.from(this.regionsLabelIndexMap.values())
  }

  paginationChange(pageNum:number){
    this.currentPage = pageNum
  }

  serchResultFilesIsArray(files:any){
    return typeof files !== 'undefined' && 
      files !== null &&
      files.constructor === Array
  }

  renderNode(file:HasPathProperty&File){
    return `${file.name ? file.name : file.path}`
  }

  TEMP(){
  }

  handleTreeNodeClick(obj:{inputItem:any,node:TreeComponent}){
    obj.node.childrenExpanded = !obj.node.childrenExpanded
  }

  /* TODO transform this into functional */
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

  get databrowserHeaderText() : string{
    return this.selectedRegions.length === 0 ?
      `No regions selected. Listing all datasets grouped by associated regions.` :
      `${this.selectedRegions.length} region${this.selectedRegions.length > 1 ? 's' : ''} selected.`
  }

  clearAllRegions(){
    this.store.dispatch({
      type : SELECT_REGIONS,
      selectRegions : []
    })
  }

  typeVisible(type:string){
    return !this.hideDataTypes.has(type)
  }

  toggleTypeVisibility(type:string){
    this.hideDataTypes.has(type) ?
      this.hideDataTypes.delete(type) :
      this.hideDataTypes.add(type)

    /* Somehow necessary, or else Angular will not mark for change */
    this.hideDataTypes = new Set(
      [...this.hideDataTypes]
    )
  }
}