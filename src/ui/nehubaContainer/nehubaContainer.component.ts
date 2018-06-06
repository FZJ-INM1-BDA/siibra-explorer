import { Component, ViewChild, ViewContainerRef, ComponentFactoryResolver, ComponentFactory, ComponentRef, OnInit } from "@angular/core";
import { NehubaViewerUnit } from "./nehubaViewer/nehubaViewer.component";
import { NehubaDataService } from "../../services/services.module";
import { Store, select } from "@ngrx/store";
import { ViewerStateInterface, safeFilter, SELECT_REGIONS } from "../../services/stateStore.service";
import { Observable } from "rxjs";
import { filter,map } from "rxjs/operators";
import * as export_nehuba from 'export_nehuba'

@Component({
  selector : 'ui-nehuba-container',
  templateUrl : './nehubaContainer.template.html',
  styleUrls : [
    `./nehubaContainer.style.css`
  ]
})

export class NehubaContainner implements OnInit{

  @ViewChild('container',{read:ViewContainerRef}) container : ViewContainerRef

  private nehubaViewerFactory : ComponentFactory<NehubaViewerUnit>

  public viewerLoaded : boolean = false
  private loadedTemplate$ : Observable<any>
  private loadedParcellation$ : Observable<any>
  private selectedRegions$ : Observable<any[]>

  private selectedRegionIndexSet : Set<number> = new Set()

  private cr : ComponentRef<NehubaViewerUnit>
  private nehubaViewer : NehubaViewerUnit
  private regionsLabelIndexMap : Map<number,any> = new Map()

  constructor(
    private csf:ComponentFactoryResolver,
    public nehubaDS : NehubaDataService,
    private store : Store<ViewerStateInterface>
  ){
    this.nehubaViewerFactory = this.csf.resolveComponentFactory(NehubaViewerUnit)
    this.loadedTemplate$ = this.store.pipe(
      select('newViewer'),
      filter(state=>typeof state !== 'undefined'))
    
    this.loadedParcellation$ = this.store.pipe(
      select('viewerState'),
      safeFilter('parcellationSelected'),
      map(state=>state.parcellationSelected))

    this.selectedRegions$ = this.store.pipe(
      select('viewerState'),
      safeFilter('regionsSelected'),
      map(state=>state.regionsSelected)
    )

    /* patch NG */
    this.patchNG()
  }

  ngOnInit(){

    /* order of subscription will determine the order of execution */
    this.loadedTemplate$.subscribe((state)=>{
      this.createNewNehuba(state.templateSelected)
      this.handleParcellation(state.parcellationSelected)
    })

    this.loadedParcellation$.subscribe(this.handleParcellation)

    this.selectedRegions$.subscribe(regions=>{
      this.selectedRegionIndexSet = new Set(regions.map(r=>r.labelIndex))
      this.selectedRegionIndexSet.size > 0 ?
        this.nehubaViewer.showSegs([...this.selectedRegionIndexSet]) :
        this.nehubaViewer.showAllSeg()
      }
    )
  }

  private patchNG(){

    const { LayerManager, UrlHashBinding } = export_nehuba.getNgPatchableObj()
    
    UrlHashBinding.prototype.setUrlHash = ()=>{
      // console.log('seturl hash')
      // console.log('setting url hash')
    }

    UrlHashBinding.prototype.updateFromUrlHash = ()=>{
      // console.log('update hash binding')
    }

    /* TODO find a more permanent fix to disable double click */
    LayerManager.prototype.invokeAction = (arg) => {
      const region = this.regionsLabelIndexMap.get(this.nehubaViewer.mouseOverSegment)
      // const foundRegion = INTERACTIVE_VIEWER.viewerHandle.mouseOverNehuba.getValue().foundRegion
      if(arg=='select'&& region ){
        this.selectedRegionIndexSet.has(region.labelIndex) ?
          this.store.dispatch({
            type : SELECT_REGIONS,
            selectRegions : [...this.selectedRegionIndexSet].filter(idx=>idx!==region.labelIndex).map(idx=>this.regionsLabelIndexMap.get(idx))
          }) :
          this.store.dispatch({
            type : SELECT_REGIONS,
            selectRegions : [...this.selectedRegionIndexSet].map(idx=>this.regionsLabelIndexMap.get(idx)).concat(region)
          })
        // const idx = this.selectedRegions.findIndex(r=>r.name==foundRegion.name)
        // if(idx>=0){
        //   this.selectedRegionsBSubject.next(this.selectedRegions.filter((_,i)=>i!=idx))
        // }else{
        //   this.selectedRegionsBSubject.next(this.selectedRegions.concat(foundRegion))
        // }
      }
    }
  }

  private handleParcellation(parcellation:any){
    this.mapRegions(parcellation.regions)
    this.nehubaViewer.regionsLabelIndexMap = this.regionsLabelIndexMap
    this.nehubaViewer.parcellationId = parcellation.ngId
  }

  private createNewNehuba(template:any){
    this.viewerLoaded = true
    this.container.clear()
    this.cr = this.container.createComponent(this.nehubaViewerFactory)
    this.nehubaViewer = this.cr.instance
    this.nehubaViewer.config = template.nehubaConfig
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
}