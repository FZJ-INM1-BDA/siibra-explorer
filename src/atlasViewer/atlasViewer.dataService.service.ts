import { Injectable, OnDestroy } from "@angular/core";
import { Store } from "@ngrx/store";
import { FETCHED_TEMPLATE, IavRootStoreInterface } from "../services/stateStore.service";
import { Subscription } from "rxjs";
import { AtlasViewerConstantsServices } from "./atlasViewer.constantService.service";

/**
 * TODO move constructor into else where and deprecate ASAP
 */

@Injectable({
  providedIn : 'root'
})
export class AtlasViewerDataService implements OnDestroy{
  
  private subscriptions : Subscription[] = []
  
  constructor(
    private store: Store<IavRootStoreInterface>,
    private constantService : AtlasViewerConstantsServices
  ){
    this.constantService.templateUrlsPr
      .then(urls => 
        urls.map(url => 
          this.constantService.raceFetch(`${this.constantService.backendUrl}${url}`)
            .then(res => res.json())
            .then(json => new Promise((resolve, reject) => {
              if(json.nehubaConfig)
                resolve(json)
              else if(json.nehubaConfigURL)
                this.constantService.raceFetch(`${this.constantService.backendUrl}${json.nehubaConfigURL}`)
                  .then(res => res.json())
                  .then(json2 => resolve({
                      ...json,
                      nehubaConfig: json2
                    }))
                  .catch(reject)
              else
                reject('neither nehubaConfig nor nehubaConfigURL defined')
            }))
            .then(json => this.store.dispatch({
              type: FETCHED_TEMPLATE,
              fetchedTemplate: json
            }))
            .catch(e => {
              console.warn('fetching template url failed', e)
              this.store.dispatch({
                type: FETCHED_TEMPLATE,
                fetchedTemplate: null
              })
            })
        ))
  }

  public searchDataset(){
    
  }

  ngOnDestroy(){
    this.subscriptions.forEach(s=>s.unsubscribe())
  }
}