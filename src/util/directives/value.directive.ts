import { Directive, Input } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { shareReplay } from "rxjs/operators";

@Directive({
  selector: '[sxplr-value-store]',
  exportAs: 'sxplrValueStore',
  standalone: true
})

export class ValueStoreDirective<T> {

  #value$ = new BehaviorSubject<null|T>(null)

  value$ = this.#value$.pipe(
    shareReplay(1),
  )

  @Input()
  set value(val: T|null) {
    this.#value$.next(val)
  }

  setValue(val: T|null) {
    this.value = val
  }
}
