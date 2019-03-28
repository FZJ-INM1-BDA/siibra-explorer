import { Component, OnInit, OnDestroy, EventEmitter, Input, Output } from "@angular/core";
import { Observable, Subscription } from "rxjs";
import { DataEntry } from "src/services/stateStore.service";
import { DatabrowserService } from "../databrowser.service";

@Component({
  selector: 'modality-picker',
  templateUrl: './modalityPicker.template.html',
  styleUrls: [
    './modalityPicker.style.css'
  ]
})

export class ModalityPicker implements OnInit, OnDestroy{

  private subscrptions: Subscription[] = []
  
  public modalities$: Observable<string>
  public modalityVisibility: Set<string> = new Set()
  public countedDataM: CountedDataModality[] = []

  @Output()
  public modalityFilterEmitter: EventEmitter<string[]> = new EventEmitter()

  constructor(
    private dbService:DatabrowserService
  ){
    
  }

  filter(dataentries:DataEntry[]) {
    return this.modalityVisibility.size === 0
      ? dataentries
      : dataentries.filter(de => de.activity.some(a => a.methods.some(m => this.modalityVisibility.has(this.dbService.temporaryFilterDataentryName(m)))))
  }

  ngOnInit(){
    this.subscrptions.push(
      this.dbService.fetchedDataEntries$.subscribe(de => 
        this.countedDataM = this.getModalityFromDE(de))
    )
  }

  ngOnDestroy(){
    this.subscrptions.forEach(s => s.unsubscribe())
  }

  toggleModality(modality: Partial<CountedDataModality>){
    const dm = this.countedDataM.find(dm => dm.name === modality.name)
    if (dm) {
      dm.visible = !dm.visible
    }
    this.modalityFilterEmitter.emit(
      this.countedDataM.filter(dm => dm.visible).map(dm => dm.name)
    )
  }

  clearAll(){
    this.countedDataM = this.countedDataM.map(cdm => {
      return {
        ...cdm,
        visible: false
      }
    })
    this.modalityFilterEmitter.emit([])
  }

  reduceDataentry(accumulator:{name:string, occurance:number}[], dataentry: DataEntry) {
    const methods = dataentry.activity
      .map(a => a.methods)
      .reduce((acc, item) => acc.concat(item), [])
      .map(this.dbService.temporaryFilterDataentryName)

    const newDE = Array.from(new Set(methods))
      .filter(m => !accumulator.some(a => a.name === m))

    return accumulator.map(({name, occurance, ...rest}) => {
      return {
        ...rest,
        name,
        occurance: methods.some(m => m === name)
          ? occurance + 1
          : occurance
      }
    }).concat(newDE.map(name => {
      return {
        name,
        occurance: 1
      }
    }))
  }

  getModalityFromDE(dataentries:DataEntry[]):CountedDataModality[] {
    return dataentries.reduce((acc, de) => this.reduceDataentry(acc, de), [])
  }
}

interface CountedDataModality{
  name: string
  occurance: number
  visible: boolean
}