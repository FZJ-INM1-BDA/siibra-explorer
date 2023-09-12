import { Directive, Input } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { debounceTime, filter, map } from 'rxjs/operators';
import { MainState, userPreference } from 'src/state';

@Directive({
  selector: '[sxplrExperimentalFlag]',
  exportAs: 'sxplrExperimentalFlag'
})
export class ExperimentalFlagDirective {

  @Input()
  set deprecated(deprecated: boolean){
    this.#inputs.next({
      deprecated: !!deprecated,
      experimental: !deprecated
    })
  }

  @Input()
  set experimental(experimental: boolean){
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
    this.#inputs.pipe(
      filter(v => !!v)
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
    private store: Store<MainState>
  ) { }

}
