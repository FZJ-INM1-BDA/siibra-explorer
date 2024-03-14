import { Directive } from "@angular/core";
import { BreakpointObserver } from "@angular/cdk/layout";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

const mediaBreakPoints = [
  '(min-width: 576px)',
  '(min-width: 768px)',
  '(min-width: 992px)',
  '(min-width: 1200px)',

  // xxl, by popular demand
  '(min-width: 2000px)'
]

enum EnumMediaBreakPoints{
  s,
  m,
  l,
  xl,
  xxl,
  xxxl
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
        if (!matches) return EnumMediaBreakPoints.xxxl
        let tally = 0
        for (const key in breakpoints) {
          if (breakpoints[key]) tally += 1
        }
        switch(tally){
        case 5: return EnumMediaBreakPoints.s
        case 4: return EnumMediaBreakPoints.m
        case 3: return EnumMediaBreakPoints.l
        case 2: return EnumMediaBreakPoints.xl
        case 1: return EnumMediaBreakPoints.xxl
        default: return EnumMediaBreakPoints.xl
        }
      })
    )
  }
}
