import { Component, Inject, OnDestroy, Optional } from "@angular/core";
import { Observable, of, Subject, Subscription } from "rxjs";
import { filter, map, shareReplay, startWith, switchMap, tap } from "rxjs/operators";
import { BsRegionInputBase } from "../../bsRegionInputBase";
import { REGISTERED_FEATURE_INJECT_DATA } from "../../constants";
import { BsFeatureService, TFeatureCmpInput } from "../../service";
import { TBSDetail } from "../type";
import { ARIA_LABELS } from 'common/constants'
import { isPr } from "../profile/profile.component";

@Component({
  selector: 'bs-features-receptor-entry',
  templateUrl: './entry.template.html',
  styleUrls: [
    './entry.style.css'
  ],
})

export class BsFeatureReceptorEntry extends BsRegionInputBase implements OnDestroy{

  private sub: Subscription[] = []
  public ARIA_LABELS = ARIA_LABELS

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
      ? this.getFeatureInstance('ReceptorDistribution', id)
      : of(null)
    ),
    shareReplay(1),
  )

  public hasPrAr$: Observable<boolean> = this.selectedReceptor$.pipe(
    map(detail => !!detail.__data.__profiles),
  )

  ngOnDestroy(){
    while (this.sub.length > 0) this.sub.pop().unsubscribe()
  }

  public receptorsSummary$ = this.region$.pipe(
    filter(v => !!v),
    switchMap(() => this.getFeatureInstancesList('ReceptorDistribution')),
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
    svc: BsFeatureService,
    @Optional() @Inject(REGISTERED_FEATURE_INJECT_DATA) data: TFeatureCmpInput
  ){
    super(svc, data)
    this.sub.push(
      this.selectedReceptor$.subscribe()
    )
  }
}
