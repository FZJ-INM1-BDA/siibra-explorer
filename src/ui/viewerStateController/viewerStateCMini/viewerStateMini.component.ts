import { Component } from "@angular/core";
import { MatBottomSheet } from "@angular/material";
import { Store } from "@ngrx/store";
import { DialogService } from "src/services/dialogService.service";

import { IavRootStoreInterface } from "src/services/stateStore.service";
import { ViewerStateBase } from '../viewerState.base'

@Component({
  selector: 'viewer-state-mini',
  templateUrl: './viewerStateMini.template.html',
  styleUrls: [
    './viewerStateMini.style.css',
  ],
})

export class ViewerStateMini extends ViewerStateBase {

  constructor(
    store$: Store<IavRootStoreInterface>,
    dialogService: DialogService,
    bottomSheet: MatBottomSheet,
  ) {
    super(store$, dialogService, bottomSheet)
  }
}
