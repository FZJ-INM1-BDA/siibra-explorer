import { Component } from "@angular/core";
import { Store } from "@ngrx/store";
import { MatBottomSheet } from "@angular/material";
import { DialogService } from "src/services/dialogService.service";

import { ViewerStateBase } from '../viewerState.base'

const compareWith = (o, n) => !o || !n
  ? false
  : o.name === n.name

@Component({
  selector: 'viewer-state-controller',
  templateUrl: './viewerState.template.html',
  styleUrls: [
    './viewerState.style.css'
  ]
})

export class ViewerStateController extends ViewerStateBase{

  constructor(
    store$: Store<any>,
    dialogService: DialogService,
    bottomSheet: MatBottomSheet
  ){
    super(store$,dialogService,bottomSheet)
  }

}