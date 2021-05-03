import { Component, OnDestroy } from "@angular/core";
import { Observable, of, Subject, Subscription } from "rxjs";
import { filter, map, shareReplay, startWith, switchMap, tap } from "rxjs/operators";
import { BsRegionInputBase } from "../../bsRegionInputBase";
import { BsFeatureReceptorService } from '../service'
import { TBSDetail } from "../type";

@Component({
  selector: 'bs-features-receptor-entry',
  templateUrl: './entry.template.html',
  styleUrls: [
    './entry.style.css'
  ],
})

export class BsFeatureReceptorEntry extends BsRegionInputBase implements OnDestroy{

  private sub: Subscription[] = []

  private selectedREntryId$ = new Subject<string>()
  private _selectedREntryId: string
  set selectedREntryId(id: string){
    this.selectedREntryId$.next(id)
    this._selectedREntryId = id
  }
  get selectedREntryId(){
    return this._selectedREntryId
  }

  public selectedReceptor$: Observable<TBSDetail> = this.selectedREntryId$.pipe(
    switchMap(id => id
      ? this.featureReceptorService.getReceptorRegionalFeatureDetail(this.region, id)
      : of(null)
    ),
    shareReplay(1),
  )

  ngOnDestroy(){
    while (this.sub.length > 0) this.sub.pop().unsubscribe()
  }

  public receptorsSummary$ = this.region$.pipe(
    filter(v => !!v),
    switchMap(val => this.featureReceptorService.getReceptorRegionalFeature(val)),
    tap(arr => {
      if (arr && arr.length > 0) {
        this.selectedREntryId = arr[0]['@id']
      } else {
        this.selectedREntryId = null
      }
    }),
    startWith([]),
    shareReplay(1),
  )

  public onSelectReceptor(receptor: string){
    this.selectedReceptor = receptor
  }

  public selectedReceptor = null
  public allReceptors$ = this.selectedReceptor$.pipe(
    map(rec => {
      if (!rec) return []
      return Object.keys(rec.__receptor_symbols || {})
    })
  )

  constructor(
    private featureReceptorService: BsFeatureReceptorService
  ){
    super()

  }
}
