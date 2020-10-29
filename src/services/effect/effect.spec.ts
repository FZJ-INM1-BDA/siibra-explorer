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


const hoc1 = {
  name: "Area hOc1 (V1, 17, CalcS) - left hemisphere",
  rgb: [
    190,
    132,
    147,
  ],
  labelIndex: 8,
  ngId: "jubrain colin v18 left",
  children: [],
  status: "publicP",
  position: [
    -8533787,
    -84646549,
    1855106,
  ],
  originDatasets: [
    {
      kgSchema: "minds/core/dataset/v1.0.0",
      kgId: "5c669b77-c981-424a-858d-fe9f527dbc07",
      filename: "Area hOc1 (V1, 17, CalcS) [v2.4, Colin 27, left hemisphere]"
    }
  ],
}

describe('effect.ts', () => {
  describe('getGetRegionFromLabelIndexId', () => {
    it('translateds hoc1 from labelIndex to region', () => {

      const getRegionFromlabelIndexId = getGetRegionFromLabelIndexId({
        parcellation: {
          ...colinsJson.parcellations[0],
          updated: true,
        },
      })
      const fetchedRegion = getRegionFromlabelIndexId({ labelIndexId: 'jubrain colin v18 left#8' })
      expect(fetchedRegion).toEqual(hoc1)
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
