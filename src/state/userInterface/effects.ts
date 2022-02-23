import { Injectable } from "@angular/core";
import { MatBottomSheet, MatBottomSheetRef } from "@angular/material/bottom-sheet";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { select, Store } from "@ngrx/store";
import { filter, map, mapTo, pairwise, startWith } from "rxjs/operators";
import { selectors } from "../atlasSelection"
import * as actions from "./actions"

@Injectable()
export class Effects{

  freshRegionSelect = this.store.pipe(
    select(selectors.selectedRegions),
    map(selReg => selReg.length),
    startWith(0),
    pairwise(),
    filter(([prev, curr]) => prev === 0 && curr > 0),
  )

  onFreshRegionSelectSidePanelOpen = createEffect(() => this.freshRegionSelect.pipe(
    mapTo(actions.openSidePanel()),
  ))

  onFreshRegionSelectSidePanelDetailExpand = createEffect(() => this.freshRegionSelect.pipe(
    mapTo(actions.expandSidePanelDetailView())
  ))

  private bottomSheetRef: MatBottomSheetRef
  constructor(
    private store: Store,
    private action: Actions,
    bottomsheet: MatBottomSheet,
    snackbar: MatSnackBar,
  ){
    this.action.pipe(
      ofType(actions.showBottomSheet)
    ).subscribe(({ template, config }) => {
      if (this.bottomSheetRef) {
        this.bottomSheetRef.dismiss()
      }
      this.bottomSheetRef = bottomsheet.open(
        template,
        config
      )
      this.bottomSheetRef.afterDismissed().subscribe(() => this.bottomSheetRef = null)
    })

    this.action.pipe(
      ofType(actions.snackBarMessage)
    ).subscribe(({ message, config }) => {
      const _config = config || { duration: 5000 }
      snackbar.open(message, "Dismiss", _config)
    })
  }
}
