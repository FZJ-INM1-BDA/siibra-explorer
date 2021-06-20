import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, HostListener, Inject, OnChanges, OnDestroy, OnInit, Optional, Output } from "@angular/core";
import { fromEvent, Observable, Subscription } from "rxjs";
import { distinctUntilChanged, map } from "rxjs/operators";
import { BS_DARKTHEME } from "../../constants";
import { BsFeatureReceptorBase } from "../base";
import { CONST } from 'common/constants'

const { RECEPTOR_FP_CAPTION } = CONST

@Component({
  selector: 'bs-features-receptor-fingerprint',
  templateUrl: './fp.template.html',
  styleUrls: [
    './fp.style.css'
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class BsFeatureReceptorFingerprint extends BsFeatureReceptorBase implements OnChanges, OnInit, OnDestroy{

  public RECEPTOR_FP_CAPTION = RECEPTOR_FP_CAPTION
  private sub: Subscription[] = []

  @HostListener('click')
  onClick(){
    if (this.selectedReceptor) {
      this.onSelectReceptor.emit(this.selectedReceptor)
    }
  }

  @Output()
  public onSelectReceptor = new EventEmitter()
  private selectedReceptor: any

  constructor(
    private elRef: ElementRef,
    @Optional() @Inject(BS_DARKTHEME) public darktheme$: Observable<boolean>,
  ){
    super()
  }

  ngOnInit(){
    // without, when devtool is out, runs sluggishly
    // informing angular that change occurs here will be handled by programmer, and not angular

    this.sub.push(
      fromEvent<CustomEvent>(this.elRef.nativeElement, 'kg-ds-prv-regional-feature-mouseover').pipe(
        map(ev => ev.detail?.data?.receptor?.label),
        distinctUntilChanged(),
      ).subscribe(label => {
        this.selectedReceptor = label
      })
    )
  }

  ngOnDestroy() {
    while (this.sub.length > 0) this.sub.pop().unsubscribe()
  }

  ngOnChanges(){
    this.error = null
    this.urls = []

    if (!this.bsFeature) {
      this.error = `bsFeature is not populated`
      return
    }

    this.urls.push(
      ...this.bsFeature.__files
        .filter(u => /_fp_/.test(u))
        .map(url => {
          return {
            url,
          }
        }),
      ...this.bsFeature.__files
        .filter(u => !/_pr_|_ar_/.test(u) && /receptors\.tsv$/.test(u))
        .map(url => {
          return {
            url,
          }
        })
    )

    const radarEl = (this.elRef.nativeElement as HTMLElement).querySelector<any>('kg-dataset-dumb-radar')
    radarEl.radarBs = this.bsFeature.__data.__fingerprint
    radarEl.metaBs = this.bsFeature.__receptor_symbols
  }
}
