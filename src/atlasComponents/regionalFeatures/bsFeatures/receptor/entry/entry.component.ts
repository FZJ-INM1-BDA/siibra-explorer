import { ChangeDetectorRef, Component, Inject, OnDestroy, Optional } from "@angular/core";
import { BehaviorSubject, Observable, of, Subscription } from "rxjs";
import { filter, map, shareReplay, startWith, switchMap, tap } from "rxjs/operators";
import { BsRegionInputBase } from "../../bsRegionInputBase";
import { REGISTERED_FEATURE_INJECT_DATA } from "../../constants";
import { BsFeatureService, TFeatureCmpInput } from "../../service";
import { TBSDetail } from "../type";
import { ARIA_LABELS } from 'common/constants'

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

  private selectedREntryId$ = new BehaviorSubject<string>(null)
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
    map(detail => !!detail.__data.__profiles && Object.keys(detail.__data.__profiles).length > 0),
  )

  ngOnDestroy(){
    while (this.sub.length > 0) this.sub.pop().unsubscribe()
  }

  public receptorsSummary$ = this.region$.pipe(
    filter(v => !!v),
    switchMap(() => this.getFeatureInstancesList('ReceptorDistribution')),
    startWith([]),
    map(
      arr => this.data?.featureId
        ? arr.filter(it => it['@id'] === this.data.featureId)
        : arr
    ),
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
    cdr: ChangeDetectorRef,
    @Optional() @Inject(REGISTERED_FEATURE_INJECT_DATA) private data: TFeatureCmpInput
  ){
    super(svc, data)
    this.sub.push(
      this.selectedReceptor$.subscribe(() => {
        cdr.markForCheck()
      }),
      this.receptorsSummary$.subscribe(arr => {
        if (arr && arr.length > 0) {
          this.selectedREntryId = arr[0]['@id']
        } else {
          this.selectedREntryId = null
        }
      })
    )
  }
}
