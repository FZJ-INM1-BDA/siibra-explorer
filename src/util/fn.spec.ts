import { fakeAsync, tick } from '@angular/core/testing'
import {} from 'jasmine'
import { hot } from 'jasmine-marbles'
import { Observable, of } from 'rxjs'
import { switchMap } from 'rxjs/operators'
import { isSame, getGetRegionFromLabelIndexId, switchMapWaitFor, bufferUntil } from './fn'

describe(`> util/fn.ts`, () => {

  describe('> #getGetRegionFromLabelIndexId', () => {
    
    const COLIN_JULICHBRAIN_LAYER_NAME = `COLIN_V25_LEFT_NG_SPLIT_HEMISPHERE`
    const LABEL_INDEX = 12
    const dummyParc = {
      regions: [
        {
          name: 'foo-bar',
          children: [
            {
              name: 'foo-bar-region-ba',
              ngId: `${COLIN_JULICHBRAIN_LAYER_NAME}-ba`,
              labelIndex: LABEL_INDEX
            },
            {
              name: 'foo-bar-region+1',
              ngId: COLIN_JULICHBRAIN_LAYER_NAME,
              labelIndex: LABEL_INDEX + 1
            },
            {
              name: 'foo-bar-region',
              ngId: COLIN_JULICHBRAIN_LAYER_NAME,
              labelIndex: LABEL_INDEX
            }
          ]
        }
      ]
    }
    it('translateds hoc1 from labelIndex to region', () => {

      const getRegionFromlabelIndexId = getGetRegionFromLabelIndexId({
        parcellation: {
          ...dummyParc,
          updated: true,
        },
      })
      const fetchedRegion = getRegionFromlabelIndexId({ labelIndexId: `${COLIN_JULICHBRAIN_LAYER_NAME}#${LABEL_INDEX}` })
      expect(fetchedRegion).toBeTruthy()
      expect(fetchedRegion.name).toEqual('foo-bar-region')
      
    })
  })
  describe(`> #isSame`, () => {
    it('should return true with null, null', () => {
      expect(isSame(null, null)).toBe(true)
    })

    it('should return true with string', () => {
      expect(isSame('test', 'test')).toBe(true)
    })

    it(`should return true with numbers`, () => {
      expect(isSame(12, 12)).toBe(true)
    })

    it('should return true with obj with name attribute', () => {

      const obj = {
        name: 'hello',
      }
      const obj2 = {
        name: 'hello',
        world: 'world',
      }
      expect(isSame(obj, obj2)).toBe(true)
      expect(obj).not.toEqual(obj2)
    })
  })

  describe('> #switchMapWaitFor', () => {
    const val = 'hello world'
    describe('> if condition is true to begin', () => {
      const conditionFn = jasmine.createSpy()
      beforeEach(() => {
        conditionFn.and.returnValue(true)
      })
      afterEach(() => {
        conditionFn.calls.reset()
      })
      it('> should wait for 16 ms then emit', fakeAsync(() => {
        const obs$ = of(val).pipe(
          switchMap(switchMapWaitFor({
            condition: conditionFn
          }))
        )
        obs$.subscribe(ex => {
          expect(conditionFn).toHaveBeenCalled()
          expect(ex).toEqual(val)
        })
        tick(200)
      }))
    })
  })

  describe('> #bufferUntil', () => {
    let src: Observable<number>
    beforeEach(() => {
      src = hot('a-b-c|', {
        a: 1,
        b: 2,
        c: 3,
      })
    })
    it('> outputs array of original emitted value', () => {

      expect(
        src.pipe(
          bufferUntil({
            condition: () => true,
            leading: true,
          })
        )
      ).toBeObservable(
        hot('a-b-c|', {
          a: [1],
          b: [2],
          c: [3],
        })
      )
    })

    it('> on condition success, emit all in array', () => {

      let counter = 0
      expect(
        src.pipe(
          bufferUntil({
            condition: () => {
              counter ++
              return counter > 2
            },
            leading: true,
            interval: 60000,
          })
        )
      ).toBeObservable(
        hot('----c|', {
          c: [1,2,3],
        })
      )
    })
  })
})
