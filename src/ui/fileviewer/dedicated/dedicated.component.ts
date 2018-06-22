import { Component, OnDestroy, Input } from "@angular/core";
import { Store, select } from "@ngrx/store";
import { DedicatedViewState, File, UNLOAD_DEDICATED_LAYER, LOAD_DEDICATED_LAYER } from "../../../services/stateStore.service";
import { Observable, Subscription } from "rxjs";
import { filter, map } from "rxjs/operators";


@Component({
  selector : 'dedicated-viewer',
  templateUrl : './dedicated.template.html',
  styleUrls : [
    `./dedicated.style.css`
  ]
})

export class DedicatedViewer implements OnDestroy{
  @Input() searchResultFile : File

  private dedicatedView$ : Observable<string|null>
  private dedicatedViewSubscription : Subscription
  private dedicatedView : string | null

  constructor(private store:Store<DedicatedViewState>){
    this.dedicatedView$ = this.store.pipe(
      select('viewerState'),
      filter(state=>typeof state !== 'undefined' && state !== null),
      map(state=>state.dedicatedView)
    )

    this.dedicatedViewSubscription = this.dedicatedView$.subscribe(url => this.dedicatedView = url)
  }

  get isShowing(){
    return this.dedicatedView === `nifti://${this.searchResultFile.url}`
  }

  get isObstructed(){
    return typeof this.dedicatedView !== 'undefined' &&
      this.dedicatedView !== null &&
      this.dedicatedView !== `nifti://${this.searchResultFile.url}`
  }

  ngOnDestroy(){
    this.dedicatedViewSubscription.unsubscribe()
  }

  showDedicatedView(){
    this.store.dispatch({
      type : LOAD_DEDICATED_LAYER,
      dedicatedView : `nifti://${this.searchResultFile.url}`
    })
  }

  removeDedicatedView(){
    this.store.dispatch({
      type : UNLOAD_DEDICATED_LAYER,
    })
  }
  
  get nowShowing():string|null{
    return this.dedicatedView ? 
      this.dedicatedView.split('/')[this.dedicatedView.split('/').length-1]:
      null
  }
}