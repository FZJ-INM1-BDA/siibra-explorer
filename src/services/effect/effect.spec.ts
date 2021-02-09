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

const COLIN_JULICHBRAIN_LAYER_NAME = `COLIN_V25_LEFT_NG_SPLIT_HEMISPHERE`
const COLIN_V25_ID = 'minds/core/parcellationatlas/v1.0.0/94c1125b-b87e-45e4-901c-00daee7f2579-25'

describe('effect.ts', () => {
  describe('getGetRegionFromLabelIndexId', () => {
    it('translateds hoc1 from labelIndex to region', () => {

      const getRegionFromlabelIndexId = getGetRegionFromLabelIndexId({
        parcellation: {
          ...colinsJson.parcellations.find(p => p['@id'] === COLIN_V25_ID),
          updated: true,
        },
      })
      const fetchedRegion = getRegionFromlabelIndexId({ labelIndexId: `${COLIN_JULICHBRAIN_LAYER_NAME}#116` })
      expect(fetchedRegion).toBeTruthy()
      expect(fetchedRegion.fullId.kg.kgId).toEqual('c9753e82-80ca-4074-a704-9dd2c4c0d58b')
      
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
