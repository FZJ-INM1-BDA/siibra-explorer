import { AtlasViewerHistoryUseEffect } from './atlasViewer.history.service'
import { TestBed, tick, fakeAsync, flush } from '@angular/core/testing'
import { provideMockActions } from '@ngrx/effects/testing'
import { provideMockStore } from '@ngrx/store/testing'
import { Observable, of, Subscription } from 'rxjs'
import { Action, Store } from '@ngrx/store'
import { defaultRootState } from '../services/stateStore.service'
import { cold } from 'jasmine-marbles'
import { HttpClientTestingModule } from '@angular/common/http/testing'

const bigbrainJson = require('!json-loader!src/res/ext/bigbrain.json')

const actions$: Observable<Action> = of({type: 'TEST'})

describe('atlasviewer.history.service.ts', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      providers: [
        AtlasViewerHistoryUseEffect,
        provideMockActions(() => actions$),
        provideMockStore({ initialState: defaultRootState })
      ]
    })
  })

  afterEach(() => {
  })

  describe('currentStateSearchParam$', () => {

    it('should fire when template is set', () => {

      const effect = TestBed.get(AtlasViewerHistoryUseEffect)
      const store = TestBed.get(Store)
      const { viewerState } = defaultRootState
      store.setState({
        ...defaultRootState,
        viewerState: {
          ...viewerState,
          templateSelected: bigbrainJson
        }
      })
      
      const expected = cold('(a)', {
        a: 'templateSelected=Big+Brain+%28Histology%29'
      })
      expect(effect.currentStateSearchParam$).toBeObservable(expected)
    })
  
    it('should fire when template and parcellation is set', () => {
  
      const effect = TestBed.get(AtlasViewerHistoryUseEffect)
      const store = TestBed.get(Store)
      const { viewerState } = defaultRootState
      store.setState({
        ...defaultRootState,
        viewerState: {
          ...viewerState,
          templateSelected: bigbrainJson,
          parcellationSelected: bigbrainJson.parcellations[0]
        }
      })
      
      const expected = cold('(a)', {
        a: 'templateSelected=Big+Brain+%28Histology%29&parcellationSelected=Cytoarchitectonic+Maps'
      })
      
      expect(effect.currentStateSearchParam$).toBeObservable(expected)
    })
  })


  describe('setNewSearchString$', () => {

    const obj = {
      spiedFn: () => {}
    }
    const subscriptions: Subscription[] = []

    let spy

    beforeAll(() => {
      spy = spyOn(obj, 'spiedFn')
    })

    beforeEach(() => {
      spy.calls.reset()
    })

    afterEach(() => {
      while (subscriptions.length > 0) subscriptions.pop().unsubscribe()
    })

    it('should fire when set', fakeAsync(() => {

      const store = TestBed.get(Store)
      const effect = TestBed.get(AtlasViewerHistoryUseEffect)
      subscriptions.push(
        effect.setNewSearchString$.subscribe(obj.spiedFn)
      )
      const { viewerState } = defaultRootState
  
      store.setState({
        ...defaultRootState,
        viewerState: {
          ...viewerState,
          templateSelected: bigbrainJson,
          parcellationSelected: bigbrainJson.parcellations[0]
        }
      })
      tick(100)
      expect(spy).toHaveBeenCalledTimes(1)
    }))

    it('should not call window.history.pushState on start', fakeAsync(() => {
      tick(100)
      expect(spy).toHaveBeenCalledTimes(0)
    }))
  
  })
  
})