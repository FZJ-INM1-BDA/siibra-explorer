import { Injectable, OnDestroy } from "@angular/core";
import { Store } from "@ngrx/store";
import { BehaviorSubject, Subscription } from "rxjs";
import { distinctUntilChanged } from "rxjs/operators";
import { actions } from "src/state/atlasSelection";

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
        actions.setViewerMode({
          viewerMode: flag
            ? "key frame"
            : null
        })
      )
    })
  }
}