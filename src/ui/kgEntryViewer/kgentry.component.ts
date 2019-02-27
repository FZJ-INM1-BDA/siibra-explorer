import { Component, Input } from "@angular/core";
import { DataEntry } from "src/services/stateStore.service";

@Component({
  selector : 'kg-entry-viewer',
  templateUrl : './kgentry.template.html',
  styleUrls : [
    './kgentry.style.css'
  ]
})

export class KgEntryViewer {
  @Input() dataset: DataEntry

  public kgData : any = null
  public kgError : any = null

  get tableColClass1(){
    return `col-xs-4 col-lg-4 tableEntry`
  }

  get tableColClass2(){
    return `col-xs-8 col-lg-8 tableEntry`
  }

  public isArray(v){
    return v.constructor === Array
  }
}
