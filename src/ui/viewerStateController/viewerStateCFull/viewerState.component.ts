import { Component } from "@angular/core";
import { Store } from "@ngrx/store";
import { DialogService } from "src/services/dialogService.service";

import { IavRootStoreInterface } from "src/services/stateStore.service";
import { ViewerStateBase } from '../viewerState.base'
import {MatBottomSheet} from "@angular/material/bottom-sheet";

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
