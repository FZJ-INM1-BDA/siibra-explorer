import { Injectable, OnDestroy } from "@angular/core";
import { Actions, Effect, ofType } from "@ngrx/effects";
import { select, Store } from "@ngrx/store";
import { merge, Observable, Subscription } from "rxjs";
import { filter, map, shareReplay, switchMap, take, withLatestFrom, mapTo } from "rxjs/operators";
import { LoggingService } from "../logging.service";
import { ADD_TO_REGIONS_SELECTION_WITH_IDS, DESELECT_REGIONS, NEWVIEWER, SELECT_PARCELLATION, SELECT_REGIONS, SELECT_REGIONS_WITH_ID } from "../state/viewerState.store";
import { generateLabelIndexId, getNgIdLabelIndexFromId, IavRootStoreInterface, recursiveFindRegionWithLabelIndexId, getMultiNgIdsRegionsLabelIndexMap, GENERAL_ACTION_TYPES } from '../stateStore.service';

@Injectable({
  providedIn: 'root',
})
export class UseEffects implements OnDestroy {

  constructor(
    private actions$: Actions,
    private store$: Store<IavRootStoreInterface>,
    private log: LoggingService,
  ) {
    this.regionsSelected$ = this.store$.pipe(
      select('viewerState'),
      select('regionsSelected'),
      shareReplay(1),
    )

    this.onDeselectRegions = this.actions$.pipe(
      ofType(DESELECT_REGIONS),
      withLatestFrom(this.regionsSelected$),
      map(([action, regionsSelected]) => {
        const { deselectRegions } = action
        const selectRegions = regionsSelected.filter(r => {
          return !(deselectRegions as any[]).find(dr => compareRegions(dr, r))
        })
        return {
          type: SELECT_REGIONS,
          selectRegions,
        }
      }),
    )

    this.onDeselectRegionsWithId$ = this.actions$.pipe(
      ofType(ACTION_TYPES.DESELECT_REGIONS_WITH_ID),
      map(action => {
        const { deselecRegionIds } = action as any
        return deselecRegionIds
      }),
      withLatestFrom(this.regionsSelected$),
      map(([ deselecRegionIds, alreadySelectedRegions ]) => {
        const deselectSet = new Set(deselecRegionIds)
        return {
          type: SELECT_REGIONS,
          selectRegions: alreadySelectedRegions
            .filter(({ ngId, labelIndex }) => !deselectSet.has(generateLabelIndexId({ ngId, labelIndex }))),
        }
      }),
    )

    this.addToSelectedRegions$ = this.actions$.pipe(
      ofType(ADD_TO_REGIONS_SELECTION_WITH_IDS),
      map(action => {
        const { selectRegionIds } = action
        return selectRegionIds
      }),
      switchMap(selectRegionIds => this.updatedParcellation$.pipe(
        filter(p => !!p),
        take(1),
        map(p => [selectRegionIds, p]),
      )),
      map(this.convertRegionIdsToRegion),
      withLatestFrom(this.regionsSelected$),
      map(([ selectedRegions, alreadySelectedRegions ]) => {
        return {
          type: SELECT_REGIONS,
          selectRegions: this.removeDuplicatedRegions(selectedRegions, alreadySelectedRegions),
        }
      }),
    )
  }

  private regionsSelected$: Observable<any[]>

  public ngOnDestroy() {
    while (this.subscriptions.length > 0) {
      this.subscriptions.pop().unsubscribe()
    }
  }

  private subscriptions: Subscription[] = []

  private parcellationSelected$ = this.actions$.pipe(
    ofType(SELECT_PARCELLATION),
  )


  private updatedParcellation$ = this.store$.pipe(
    select('viewerState'),
    select('parcellationSelected'),
    map(p => p.updated ? p : null),
    shareReplay(1),
  )

  @Effect()
  public onDeselectRegions: Observable<any>

  @Effect()
  public onDeselectRegionsWithId$: Observable<any>

  private convertRegionIdsToRegion = ([selectRegionIds, parcellation]) => {
    const { ngId: defaultNgId } = parcellation
    return (selectRegionIds as any[])
      .map(labelIndexId => getNgIdLabelIndexFromId({ labelIndexId }))
      .map(({ ngId, labelIndex }) => {
        return {
          labelIndexId: generateLabelIndexId({
            ngId: ngId || defaultNgId,
            labelIndex,
          }),
        }
      })
      .map(({ labelIndexId }) => {
        return recursiveFindRegionWithLabelIndexId({
          regions: parcellation.regions,
          labelIndexId,
          inheritedNgId: defaultNgId,
        })
      })
      .filter(v => {
        if (!v) {
          this.log.log(`SELECT_REGIONS_WITH_ID, some ids cannot be parsed intto label index`)
        }
        return !!v
      })
  }

  private removeDuplicatedRegions = (...args) => {
    const set = new Set()
    const returnArr = []
    for (const regions of args) {
      for (const region of regions) {
        if (!set.has(region.name)) {
          returnArr.push(region)
          set.add(region.name)
        }
      }
    }
    return returnArr
  }

  @Effect()
  public addToSelectedRegions$: Observable<any>

  /**
   * for backwards compatibility.
   * older versions of atlas viewer may only have labelIndex as region identifier
   */
  @Effect()
  public onSelectRegionWithId = this.actions$.pipe(
    ofType(SELECT_REGIONS_WITH_ID),
    map(action => {
      const { selectRegionIds } = action
      return selectRegionIds
    }),
    switchMap(selectRegionIds => this.updatedParcellation$.pipe(
      filter(p => !!p),
      take(1),
      map(parcellation => [selectRegionIds, parcellation]),
    )),
    map(this.convertRegionIdsToRegion),
    map(selectRegions => {
      return {
        type: SELECT_REGIONS,
        selectRegions,
      }
    }),
  )

  /**
   * side effect of selecting a parcellation means deselecting all regions
   */
  @Effect()
  public onParcellationSelected$ = merge(
    this.parcellationSelected$,
    this.actions$.pipe(
      ofType(NEWVIEWER)
    )
  ).pipe(
    mapTo({
      type: SELECT_REGIONS,
      selectRegions: [],
    })
  )
}

export const getGetRegionFromLabelIndexId = ({ parcellation }) => {
  const { ngId: defaultNgId, regions } = parcellation
  // if (!updated) throw new Error(`parcellation not yet updated`)
  return ({ labelIndexId }) =>
    recursiveFindRegionWithLabelIndexId({ regions, labelIndexId, inheritedNgId: defaultNgId })
}

export const compareRegions: (r1: any, r2: any) => boolean = (r1, r2) => {
  if (!r1) { return !r2 }
  if (!r2) { return !r1 }
  return r1.ngId === r2.ngId
    && r1.labelIndex === r2.labelIndex
    && r1.name === r2.name
}

const ACTION_TYPES = {
  DESELECT_REGIONS_WITH_ID: 'DESELECT_REGIONS_WITH_ID',
}

export const VIEWER_STATE_ACTION_TYPES = ACTION_TYPES
