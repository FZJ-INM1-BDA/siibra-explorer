import {} from 'jasmine'
import { UseEffects } from './effect'
import { TestBed } from '@angular/core/testing'
import { Observable } from 'rxjs'
import { SELECT_PARCELLATION, NEWVIEWER, SELECT_REGIONS } from '../state/viewerState.store'
import { provideMockActions } from '@ngrx/effects/testing'
import { hot } from 'jasmine-marbles'
import { provideMockStore } from '@ngrx/store/testing'
import { defaultRootState } from '../stateStore.service'

describe('effect.ts', () => {

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
