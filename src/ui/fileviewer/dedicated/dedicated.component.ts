import { Component, OnDestroy, Input } from "@angular/core";
import { Store, select } from "@ngrx/store";
import { DedicatedViewState, File, ADD_NG_LAYER, REMOVE_NG_LAYER, NgViewerStateInterface } from "../../../services/stateStore.service";
import { Observable, Subscription } from "rxjs";
import { filter, map } from "rxjs/operators";
import { getActiveColorMapFragmentMain } from "../../nehubaContainer/nehubaContainer.component";


@Component({
  selector : 'dedicated-viewer',
  templateUrl : './dedicated.template.html',
  styleUrls : [
    `./dedicated.style.css`
  ]
})

export class DedicatedViewer implements OnDestroy{
  @Input() searchResultFile : File

  private ngLayers$ : Observable<NgViewerStateInterface>
  private ngLayersSubscription : Subscription
  private ngLayers : Set<string> = new Set()

  constructor(private store:Store<DedicatedViewState>){
    this.ngLayers$ = this.store.pipe(
      select('ngViewerState')
    )

    this.ngLayersSubscription = this.ngLayers$.subscribe(layersInterface => this.ngLayers = new Set(layersInterface.layers.map(l => l.source)))
  }

  get isShowing(){
    return this.ngLayers.has(`nifti://${this.searchResultFile.url}`)
  }

  ngOnDestroy(){
    this.ngLayersSubscription.unsubscribe()
  }

  showDedicatedView(){
    this.store.dispatch({
      type : ADD_NG_LAYER,
      layer : {
        name : this.searchResultFile.url,
        source : `nifti://${this.searchResultFile.url}`,
        mixability : 'nonmixable',
        shader : getActiveColorMapFragmentMain()
      }
    })
  }

  removeDedicatedView(){
    this.store.dispatch({
      type : REMOVE_NG_LAYER,
      layer : {
        name : this.searchResultFile.url
      }
    })
  }
}