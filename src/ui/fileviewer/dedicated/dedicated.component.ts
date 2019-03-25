import { Component, OnDestroy, Input } from "@angular/core";
import { Store, select } from "@ngrx/store";
import { DedicatedViewState, File, ADD_NG_LAYER, REMOVE_NG_LAYER, NgViewerStateInterface } from "../../../services/stateStore.service";
import { Observable, Subscription } from "rxjs";
import { getActiveColorMapFragmentMain } from "../../nehubaContainer/nehubaContainer.component";
import { ToastService } from "../../../services/toastService.service";

/**
 * TODO maybe obsolete
 */

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

  constructor(
    private toastService:ToastService,
    private store:Store<DedicatedViewState>
  ){
    this.ngLayers$ = this.store.pipe(
      select('ngViewerState')
    )

    this.ngLayersSubscription = this.ngLayers$.subscribe(layersInterface => this.ngLayers = new Set(layersInterface.layers.map(l => l.source)))
  }

  get isShowing(){
    return this.ngLayers.has(`nifti://${this.searchResultFile.absolutePath}`)
  }

  ngOnDestroy(){
    this.ngLayersSubscription.unsubscribe()
  }

  showDedicatedView(){
    this.store.dispatch({
      type : ADD_NG_LAYER,
      layer : {
        name : this.searchResultFile.absolutePath,
        source : `nifti://${this.searchResultFile.absolutePath}`,
        mixability : 'nonmixable',
        shader : getActiveColorMapFragmentMain()
      }
    })
    setTimeout(() => {
      if(this.isShowing)
        this.toastService.showToast('nifti showing')
      else
        this.toastService.showToast('nifti cannot be shown until current nifti layer is cleared')
    }, 128)
  }

  removeDedicatedView(){
    this.store.dispatch({
      type : REMOVE_NG_LAYER,
      layer : {
        name : this.searchResultFile.absolutePath
      }
    })
  }
}