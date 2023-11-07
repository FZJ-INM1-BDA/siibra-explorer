import { Directive, OnDestroy } from "@angular/core";
import { Subject } from "rxjs";

@Directive({
  standalone: true
})
export class DestroyDirective implements OnDestroy{
  public destroyed$ = new Subject<null>()
  ngOnDestroy(): void {
    this.destroyed$.next()
    this.destroyed$.complete()
  }
}
