import { Injectable, OnDestroy } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { Store } from "@ngrx/store";
import { BehaviorSubject, Subscription } from "rxjs";
import { distinctUntilChanged } from "rxjs/operators";
import { viewerStateSetViewerMode } from "src/services/state/viewerState.store.helper";
import { KEYFRAME_VIEWMODE } from "./constants";
import { KeyFrameCtrlCmp } from "./keyframeCtrl/keyframeCtrl.component";

@Injectable()
export class KeyFrameService implements OnDestroy {

  inSession$ = new BehaviorSubject(false)
  private subs: Subscription[] = []
  private _inSession = false
  get inSession(){
    return this._inSession
  }
  set inSession(val){
    this._inSession = val
    this.inSession$.next(val)
  }

  ngOnDestroy(){
    while(this.subs.length) this.subs.pop().unsubscribe()
  }
  
  startKeyFrameSession(){
    this.inSession = true
  }
  endKeyFrameSession(){
    this.inSession = false
  }

  constructor(
    // private dialog: MatDialog,
    private store: Store<any>
  ){
    this.inSession$.pipe(
      distinctUntilChanged()
    ).subscribe(flag => {

      // TODO enable side bar when ready
      this.store.dispatch(
        viewerStateSetViewerMode({
          payload: flag && KEYFRAME_VIEWMODE
        })
      )
    })
  }
}