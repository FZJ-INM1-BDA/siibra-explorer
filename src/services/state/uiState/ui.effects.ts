import { Injectable, OnDestroy } from "@angular/core";
import { Actions, ofType } from "@ngrx/effects";
import { Subscription } from "rxjs";
import { generalActionError } from "src/services/stateStore.helper";

@Injectable({
  providedIn: 'root'
})

export class UiEffects implements OnDestroy{

  private subscriptions: Subscription[] = []

  constructor(private actions$: Actions){
    this.subscriptions.push(
      this.actions$.pipe(
        ofType(generalActionError.type)
      ).subscribe(console.log)
    )
  }

  ngOnDestroy(){
    while (this.subscriptions.length > 0) this.subscriptions.pop().unsubscribe()
  }
}
