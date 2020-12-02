import {} from 'jasmine'
import { getGetRegionFromLabelIndexId, UseEffects } from './effect'
import { TestBed } from '@angular/core/testing'
import { Observable } from 'rxjs'
import { SELECT_PARCELLATION, NEWVIEWER, SELECT_REGIONS } from '../state/viewerState.store'
import { provideMockActions } from '@ngrx/effects/testing'
import { hot } from 'jasmine-marbles'
import { provideMockStore } from '@ngrx/store/testing'
import { defaultRootState } from '../stateStore.service'

const colinsJson = require('!json-loader!../../res/ext/colin.json')

const COLIN_JULICHBRAIN_LAYER_NAME = `COLIN_V25_LEFT_NG`

describe('effect.ts', () => {
  describe('getGetRegionFromLabelIndexId', () => {
    it('translateds hoc1 from labelIndex to region', () => {

      const getRegionFromlabelIndexId = getGetRegionFromLabelIndexId({
        parcellation: {
          ...colinsJson.parcellations[0],
          updated: true,
        },
      })
      const fetchedRegion = getRegionFromlabelIndexId({ labelIndexId: `${COLIN_JULICHBRAIN_LAYER_NAME}#116` })
      expect(fetchedRegion).toBeTruthy()
      expect(fetchedRegion.fullId.kg.kgId).toEqual('b09aaa77-f41b-4008-b8b9-f984b0417cf3')
      
    })
  })

  describe('UseEffects', () => {
    let actions$:Observable<any>

    beforeEach(() => {  
      TestBed.configureTestingModule({
        providers: [
          UseEffects,
          provideMockActions(() => actions$),
          provideMockStore({ initialState: defaultRootState })
        ]
      })
    })

    it('both SELECT_PARCELLATION and NEWVIEWER actions should trigger onParcellationSelected$', () => {
      const useEffectsInstance: UseEffects = TestBed.inject(UseEffects)
      actions$ = hot(
        'ab',
        {
          a: { type: SELECT_PARCELLATION },
          b: { type: NEWVIEWER }
        }
      )
      expect(
        useEffectsInstance.onParcChange$
      ).toBeObservable(
        hot(
          'aa',
          {
            a: { type: SELECT_REGIONS, selectRegions: [] }
          }  
        )
      )
    })
  })
})
