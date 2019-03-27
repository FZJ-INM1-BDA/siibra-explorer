import { Component, OnDestroy, OnInit, Input, Injector, ViewChild } from "@angular/core";
import { DataEntry, File } from "src/services/stateStore.service";
import { Subscription } from "rxjs";
import { ComponentFactory, ComponentRef } from "@angular/core/src/render3";
import { FileViewer } from "src/ui/fileviewer/fileviewer.component";
import { DatabrowserService } from "../databrowser.service";
import { ModalityPicker } from "../modalityPicker/modalityPicker.component";

@Component({
  selector : 'data-browser',
  templateUrl : './databrowser.template.html',
  styleUrls : [
    `./databrowser.style.css`
  ]
})

export class DataBrowser implements OnDestroy,OnInit{

  public currentPage: number = 0
  public hitsPerPage: number = 5

  public dataEntries: DataEntry[] = []

  get selectedRegions(){
    return this.dbService.selectedRegions
  }

  /**
   * TODO
   * viewport
   * user defined filter
   * etc
   */
  public gemoetryFilter: any

  constructor(
    private injector: Injector,
    private dbService: DatabrowserService
  ){

  }

  /**
   * TODO filter types
   */
  public modalityFilter: string[] = []
  private subscriptions : Subscription[] = []

  @ViewChild(ModalityPicker)
  modalityPicker: ModalityPicker

  ngOnInit(){

    /**
     * TODO fix
     */
    // this.subscriptions.push(
    //   this.filterApplied$.subscribe(() => this.currentPage = 0)
    // )
  }

  ngOnDestroy(){
    this.subscriptions.forEach(s=>s.unsubscribe())
  }

  deselectRegion(region:any){
    /**
     * when user clicks x on region selector
     */
    
    this.dbService.updateRegionSelection(
      this.selectedRegions.filter(r => r.name !== region.name)
    )
  }

  uncheckModality(modality:string){
    this.modalityPicker.toggleModality({name: modality})
  }

  /**
   * TODO
   * work around for now. 
   * service does not have injector, and thus cannot create componentt
   */
  private fileViewerComponentFactory: ComponentFactory<FileViewer>
  private dataWindowRegistry: Set<string> = new Set()
  launchFile({dataset, file}:{dataset:DataEntry, file:File}){

    if(dataset.formats.findIndex(format => format.toLowerCase() === 'nifti' ) >= 0){

      // TODO use KG id in future
      if(this.dataWindowRegistry.has(file.name)){
        /* already open, will not open again */
        return
      }
      /* not yet open, add the name to registry */
      this.dataWindowRegistry.add(file.name)

      const component = this.fileViewerComponentFactory.create(this.injector)
      component.instance.searchResultFile = file
      // const compref = this.dbService.attachFileViewer(component, file)

      /* on destroy, removes name from registry */
      // compref.onDestroy(() => this.dataWindowRegistry.delete(file.name))
    }else{
      /** no mime type  */
    }
  }
}

export interface DataEntryFilter{
  filter: (dataentries:DataEntry[]) => DataEntry[]
}
