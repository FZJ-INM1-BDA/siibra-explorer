import { fakeAsync, tick } from '@angular/core/testing'
import {} from 'jasmine'
import { cold, hot } from 'jasmine-marbles'
import { of } from 'rxjs'
import { switchMap } from 'rxjs/operators'
import { isSame, getGetRegionFromLabelIndexId, switchMapWaitFor } from './fn'

describe(`> util/fn.ts`, () => {

  describe('> #getGetRegionFromLabelIndexId', () => {
    const colinsJson = require('!json-loader!../res/ext/colin.json')
    
    const COLIN_JULICHBRAIN_LAYER_NAME = `COLIN_V25_LEFT_NG_SPLIT_HEMISPHERE`
    const COLIN_V25_ID = 'minds/core/parcellationatlas/v1.0.0/94c1125b-b87e-45e4-901c-00daee7f2579-26'
    
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
})
