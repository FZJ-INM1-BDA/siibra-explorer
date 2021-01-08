import { Directive } from "@angular/core";
import { Store } from "@ngrx/store";
import { Observable } from "rxjs";
import { map, debounceTime, shareReplay } from "rxjs/operators";
import { cvtStateToSearchParam } from "src/atlasViewer/atlasViewer.urlUtil";

const jsonVersion = '0.0.1'

interface IJsonifiedState {
  ver: string
  queryString: any
}

@Directive({
  selector: '[iav-state-aggregator]',
  exportAs: 'iavStateAggregator'
})

export class StateAggregator{

  public jsonifiedSstate$: Observable<IJsonifiedState>
  constructor(
    private store$: Store<any>
  ){
    this.jsonifiedSstate$ = this.store$.pipe(
      debounceTime(100),
      map(json => {
        const queryString = cvtStateToSearchParam(json)
        return {
          ver: jsonVersion,
          queryString: queryString.toString()
        }
      }),
      shareReplay(1)
    )
  }
}
