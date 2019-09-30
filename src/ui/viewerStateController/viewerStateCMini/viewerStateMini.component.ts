import { Component } from "@angular/core";
import { Store } from "@ngrx/store";
import { MatBottomSheet } from "@angular/material";
import { DialogService } from "src/services/dialogService.service";

import { ViewerStateBase } from '../viewerState.base'

@Component({
  selector: 'viewer-state-mini',
  templateUrl: './viewerStateMini.template.html',
  styleUrls: [
    './viewerStateMini.style.css'
  ]
})

export class ViewerStateMini extends ViewerStateBase{

  constructor(
    store$: Store<any>,
    dialogService: DialogService,
    bottomSheet: MatBottomSheet
  ){
    super(store$,dialogService,bottomSheet)
  }
}
