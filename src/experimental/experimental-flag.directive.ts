import { NgIf } from '@angular/common';
import { ChangeDetectorRef, Directive, Input, inject } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { BehaviorSubject, combineLatest, concat, of } from 'rxjs';
import { debounceTime, filter, map, takeUntil } from 'rxjs/operators';
import { MainState, userPreference } from 'src/state';
import { DestroyDirective } from 'src/util/directives/destroy.directive';

@Directive({
  selector: '[sxplrExperimentalFlag]',
  exportAs: 'sxplrExperimentalFlag',
  hostDirectives: [NgIf, DestroyDirective],
  standalone: true
})
export class ExperimentalFlagDirective {

  private readonly ngIf = inject(NgIf)
  private readonly destroyed$ = inject(DestroyDirective).destroyed$

  @Input()
  set deprecated(deprecated: boolean){
    if (typeof deprecated === 'undefined') {
      return
    }
    this.#inputs.next({
      deprecated: !!deprecated,
      experimental: !deprecated
    })
  }

  @Input()
  set experimental(experimental: boolean){
    if (typeof experimental === 'undefined') {
      return
    }
    this.#inputs.next({
      deprecated: !experimental,
      experimental: !!experimental
    })
  }

  #showExperimentalFlag$ = this.store.pipe(
    select(userPreference.selectors.showExperimental)
  )

  #inputs = new BehaviorSubject<{ deprecated: boolean, experimental: boolean }>(null)

  show$ = combineLatest([
    concat(
      of({ deprecated: null, experimental: null }),
      this.#inputs.pipe(
        filter(v => !!v),
      ),
    ),
    this.#showExperimentalFlag$
  ]).pipe(
    /**
     * state:
     *                      | experimental flag set | experimental flag not set |
     * marked experimental  | show                  | hide                      |
     * marked deprecated    | hide                  | show                      |
     */
    map(([ { deprecated, experimental }, showExperimental ]) => {
      if (experimental) {
        return showExperimental
      }
      if (deprecated) {
        return !showExperimental
      }
      return true
    }),
    debounceTime(0),
  )

  constructor(
    private store: Store<MainState>,
    private cdr: ChangeDetectorRef,
  ) {
    this.show$.pipe(
      takeUntil(this.destroyed$)
    ).subscribe(flag => {
      this.ngIf.ngIf = flag
      this.cdr.detectChanges()
    })
  }

}
