const defaultState = {
  fetchedDataEntries: [],
  favDataEntries: [],
  fetchedSpatialData: [],
}

import { DataBrowserUseEffect } from './databrowser.useEffect'
import { TestBed } from '@angular/core/testing'
import { Observable } from 'rxjs'
import { provideMockActions } from '@ngrx/effects/testing'
import { provideMockStore } from '@ngrx/store/testing'
import { hot } from 'jasmine-marbles'

let actions$: Observable<any>
describe('> databrowser.useEffect.ts', () => {
  describe('> DataBrowserUseEffect', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          provideMockStore({
            initialState: {
              dataStore: defaultState
            }
          }),
          provideMockActions(() => actions$),
          DataBrowserUseEffect,
        ]
      })
    })
    it('> should instantiate properly', () => {
      const useEffect = TestBed.inject(DataBrowserUseEffect)
      expect(useEffect.favDataEntries$).toBeObservable(
        hot('a', {
          a: []
        })
      )
    })
  })
})