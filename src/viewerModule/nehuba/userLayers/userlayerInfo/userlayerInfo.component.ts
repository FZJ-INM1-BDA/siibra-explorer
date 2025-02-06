import { Component, Inject, inject } from "@angular/core";
import { MAT_DIALOG_DATA } from "src/sharedModules/angularMaterial.exports"
import { ARIA_LABELS, CONST } from 'common/constants'
import { BehaviorSubject, combineLatest, concat, of, timer } from "rxjs";
import { map, take } from "rxjs/operators";
import { MediaQueryDirective } from "src/util/directives/mediaQuery.directive";
import { Action } from "src/util/types";

export type UserLayerInfoData = {
  layerName: string
  filename: string
  warning: string[]
  actions?: Action[]
}

@Component({
  selector: `sxplr-userlayer-info`,
  templateUrl: './userlayerInfo.template.html',
  styleUrls: [
    './userlayerInfo.style.css'
  ],
  hostDirectives: [
    MediaQueryDirective
  ]
})

export class UserLayerInfoCmp {

  private readonly mediaQuery = inject(MediaQueryDirective)

  ARIA_LABELS = ARIA_LABELS
  CONST = CONST
  public HIDE_NG_TUNE_CTRL = {
    ONLY_SHOW_OPACITY: 'export-mode,lower_threshold,higher_threshold,brightness,contrast,colormap,hide-threshold-checkbox,hide-zero-value-checkbox'
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
        this.mediaQuery.mediaBreakPoint$.pipe(
          map(val => val >= 2)
        ),
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
