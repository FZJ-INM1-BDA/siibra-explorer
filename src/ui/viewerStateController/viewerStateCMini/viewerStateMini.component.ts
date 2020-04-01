import { Component } from "@angular/core";
import { Store } from "@ngrx/store";
import { DialogService } from "src/services/dialogService.service";

import { IavRootStoreInterface } from "src/services/stateStore.service";
import { ViewerStateBase } from '../viewerState.base'
import {MatBottomSheet} from "@angular/material/bottom-sheet";

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
