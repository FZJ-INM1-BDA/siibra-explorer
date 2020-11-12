import { Input, Output, EventEmitter, OnDestroy } from "@angular/core"
import { LoggingService } from "src/logging"
import { DatabrowserService } from "../singleDataset/singleDataset.base"
import { Observable, Subject, Subscription } from "rxjs"
import { IDataEntry } from "src/services/stateStore.service"
import { setsEql } from 'common/util'
import { switchMap, tap } from "rxjs/operators"
import { getStringIdsFromRegion, flattenReducer } from 'common/util'

export class DatabrowserBase implements OnDestroy{

  private _subscriptions: Subscription[] = []

  @Output()
  public dataentriesUpdated: EventEmitter<IDataEntry[]> = new EventEmitter()

  private _regions: any[] = []
  
  public regions$ = new Subject<any[]>()
  get regions(){
    return this._regions
  }
  @Input()
  set regions(arr: any[]){
    const currentSet = new Set(this._regions.map(r => getStringIdsFromRegion(r)).reduce(flattenReducer, []))
    const newSet = new Set(arr.map(r => getStringIdsFromRegion(r)).reduce(flattenReducer, []).filter(v => !!v))
    if (setsEql(newSet, currentSet)) return
    this._regions = arr.filter(r => !getStringIdsFromRegion(r).every(id => !id))
    this.regions$.next(this._regions)
  }

  public fetchError: boolean = false
  public fetchingFlag = false

  public favDataentries$: Observable<Partial<IDataEntry>[]>

  public dataentries: IDataEntry[] = []

  constructor(
    private dbService: DatabrowserService,
    private log: LoggingService,
  ){

    this.favDataentries$ = this.dbService.favedDataentries$
    
    this._subscriptions.push(
      this.regions$.pipe(
        tap(() => this.fetchingFlag = true),
        switchMap(regions => this.dbService.getDataByRegion({ regions })),
      ).subscribe(
        de => {
          this.fetchingFlag = false
          this.dataentries = de
          this.dataentriesUpdated.emit(de)
        },
        e => {
          this.log.error(e)
          this.fetchError = true
        }
      )
    )
  }

  ngOnDestroy(){
    while(this._subscriptions.length > 0) this._subscriptions.pop().unsubscribe()
  }

  public retryFetchData(event: MouseEvent) {
    event.preventDefault()
    this.dbService.manualFetchDataset$.next(null)
  }

  public toggleFavourite(dataset: IDataEntry) {
    this.dbService.toggleFav(dataset)
  }

  public saveToFavourite(dataset: IDataEntry) {
    this.dbService.saveToFav(dataset)
  }

  public removeFromFavourite(dataset: IDataEntry) {
    this.dbService.removeFromFav(dataset)
  }
}
