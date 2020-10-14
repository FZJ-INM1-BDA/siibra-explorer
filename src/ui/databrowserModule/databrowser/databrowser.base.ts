import { Input, Output, EventEmitter } from "@angular/core"
import { LoggingService } from "src/logging"
import { DatabrowserService } from "../singleDataset/singleDataset.base"
import { Observable } from "rxjs"
import { IDataEntry } from "src/services/stateStore.service"
import { getUniqueRegionId } from 'common/util'

export class DatabrowserBase{

  @Output()
  public dataentriesUpdated: EventEmitter<IDataEntry[]> = new EventEmitter()

  @Input()
  regions: any[] = []

  @Input()
  public template: any

  @Input()
  public parcellation: any

  public fetchError: boolean = false
  public fetchingFlag = false

  public favDataentries$: Observable<Partial<IDataEntry>[]>

  public dataentries: IDataEntry[] = []

  constructor(
    private dbService: DatabrowserService,
    private log: LoggingService,
  ){

    this.favDataentries$ = this.dbService.favedDataentries$
  }

  ngOnChanges(){

    const { regions, parcellation, template } = this
    this.regions = this.regions.map(r => {
      /**
       * TODO to be replaced with properly region UUIDs from KG
       */
      const uniqueRegionId = getUniqueRegionId(template, parcellation, r)
      return {
        fullId: uniqueRegionId,
        id: uniqueRegionId,
        ...r,
      }
    })
    this.fetchingFlag = true

    // input may be undefined/null
    if (!parcellation) { return }

    /**
     * reconstructing parcellation region is async (done on worker thread)
     * if parcellation region is not yet defined, return.
     * parccellation will eventually be updated with the correct region
     */
    if (!parcellation.regions) { return }

    this.dbService.getDataByRegion({ regions, parcellation, template })
      .then(de => {
        this.dataentries = de
        return de
      })
      .catch(e => {
        this.log.error(e)
        this.fetchError = true
      })
      .finally(() => {
        this.fetchingFlag = false
        this.dataentriesUpdated.emit(this.dataentries)
      })
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
