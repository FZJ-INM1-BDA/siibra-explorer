import { Component } from "@angular/core";
import { MatBottomSheet } from "@angular/material";
import { Store } from "@ngrx/store";
import { DialogService } from "src/services/dialogService.service";

import { IavRootStoreInterface } from "src/services/stateStore.service";
import { ViewerStateBase } from '../viewerState.base'

@Component({
  selector: 'viewer-state-controller',
  templateUrl: './viewerState.template.html',
  styleUrls: [
    './viewerState.style.css',
  ],
})

export class ViewerStateController extends ViewerStateBase {

  constructor(
    store$: Store<IavRootStoreInterface>,
    dialogService: DialogService,
    bottomSheet: MatBottomSheet,
  ) {
    super(store$, dialogService, bottomSheet)
  }

}
