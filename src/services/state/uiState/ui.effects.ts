import { Injectable, OnDestroy } from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Actions, ofType } from "@ngrx/effects";
import { Subscription } from "rxjs";
import { generalActionError } from "src/services/stateStore.helper";

@Injectable({
  providedIn: 'root'
})

export class UiEffects implements OnDestroy{

  private subscriptions: Subscription[] = []

  constructor(
    private actions$: Actions,
    snackBar: MatSnackBar
  ){
    this.subscriptions.push(
      this.actions$.pipe(
        ofType(generalActionError.type)
      ).subscribe((payload: any) => {
        if (!payload.message) console.log(payload)
        snackBar.open(payload.message || `Error: cannot complete your action.`, 'Dismiss', { duration: 5000 })
      })
    )
  }

  ngOnDestroy(){
    while (this.subscriptions.length > 0) this.subscriptions.pop().unsubscribe()
  }
}
