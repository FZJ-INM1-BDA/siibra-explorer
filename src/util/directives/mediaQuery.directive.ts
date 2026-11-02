import { Directive } from "@angular/core";
import { BreakpointObserver } from "@angular/cdk/layout";
import { concat, defer, Observable, of } from "rxjs";
import { map, shareReplay } from "rxjs/operators";

const mediaBreakPoints = [
  '(min-width: 576px)',
  '(min-width: 768px)',
  '(min-width: 992px)',
  '(min-width: 1200px)',

  // xxl, by popular demand
  '(min-width: 2000px)'
]

enum EnumMediaBreakPoints{
  xxxl,
  xxl,
  xl,
  l,
  m,
  s,
}

@Directive({
  selector: '[iav-media-query]',
  exportAs: 'iavMediaQuery',
  standalone: true
})

export class MediaQueryDirective{

  public mediaBreakPoint$: Observable<EnumMediaBreakPoints>
  constructor(
    bpObs: BreakpointObserver
  ){
    this.mediaBreakPoint$ = bpObs.observe(mediaBreakPoints).pipe(
      map(({ breakpoints, matches }) => {
        if (!matches) return EnumMediaBreakPoints.s
        let tally = 0
        for (const key in breakpoints) {
          if (breakpoints[key]) tally += 1
        }
        switch(tally){
        case 5: return EnumMediaBreakPoints.xxl
        case 4: return EnumMediaBreakPoints.xl
        case 3: return EnumMediaBreakPoints.l
        case 2: return EnumMediaBreakPoints.m
        case 1: return EnumMediaBreakPoints.s

        default: return EnumMediaBreakPoints.s
        }
      })
    )
  }

  cssWidth$ = concat(
    of('90dvw'),
    defer(() => this.mediaBreakPoint$).pipe(
      map(v => {
        switch (v) {
          case EnumMediaBreakPoints.s: return '90dvw'
          case EnumMediaBreakPoints.m: return '40dvw'
          case EnumMediaBreakPoints.l: return '40dvw'
          case EnumMediaBreakPoints.xl: return '40dvw'
          case EnumMediaBreakPoints.xxl: return '30dvw'
          case EnumMediaBreakPoints.xxxl: return '25dvw'
          default: return '90dvw'
        }
      })
    )
  ).pipe(
    shareReplay(1),
  )
}
