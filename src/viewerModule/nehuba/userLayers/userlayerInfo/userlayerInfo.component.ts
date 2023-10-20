import { Component, Inject, ViewChild } from "@angular/core";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { ARIA_LABELS, CONST } from 'common/constants'
import { BehaviorSubject, Subject, combineLatest, concat, of, timer } from "rxjs";
import { map, switchMap, take } from "rxjs/operators";
import { MediaQueryDirective } from "src/util/directives/mediaQuery.directive";

export type UserLayerInfoData = {
  layerName: string
  filename: string
  warning: string[]
}

@Component({
  selector: `sxplr-userlayer-info`,
  templateUrl: './userlayerInfo.template.html',
  styleUrls: [
    './userlayerInfo.style.css'
  ]
})

export class UserLayerInfoCmp {
  ARIA_LABELS = ARIA_LABELS
  CONST = CONST
  public HIDE_NG_TUNE_CTRL = {
    ONLY_SHOW_OPACITY: 'lower_threshold,higher_threshold,brightness,contrast,colormap,hide-threshold-checkbox,hide-zero-value-checkbox'
  }

  #mediaQuery = new Subject<MediaQueryDirective>()

  @ViewChild(MediaQueryDirective, { read: MediaQueryDirective })
  set mediaQuery(val: MediaQueryDirective) {
    this.#mediaQuery.next(val)
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: UserLayerInfoData
  ){

  }

  #showMore = new BehaviorSubject(false)

  view$ = concat(
    timer(1000).pipe(
      take(1),
      map(() => null as { showMore: boolean, compact: boolean })
    ),
    combineLatest([
      this.#showMore,
      concat(
        of(null as MediaQueryDirective),
        this.#mediaQuery,
      ).pipe(
        switchMap(mediaQueryD => mediaQueryD
          ? mediaQueryD.mediaBreakPoint$.pipe(
            map(val => val >= 2)
          )
          : of(false))
      )
    ]).pipe(
      map(([ showMore, compact ]) => ({
        showMore,
        compact,
      }))
    )
  )

  toggleShowMore(){
    this.#showMore.next(!this.#showMore.value)
  }
}
