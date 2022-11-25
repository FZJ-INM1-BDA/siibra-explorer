import { fakeAsync, tick } from '@angular/core/testing'
import { hot } from 'jasmine-marbles'
import { Observable, of } from 'rxjs'
import { switchMap } from 'rxjs/operators'
import { switchMapWaitFor, bufferUntil, arrayOfPrimitiveEqual } from './fn'

describe(`> util/fn.ts`, () => {


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

  describe("> #arrayOfPrimitiveEqual", () => {

    const primitives: {text: string, examples: (string|number)[][]}[] = [{
      text: 'string',
      examples: [
        ['foo', 'bar'], 
        ['foo', 'bar'], 
        ['buzz', 'boo'], 
        ['hello'], 
      ]
    }, {
      text: 'number',
      examples: [
        [0, 1],
        [0, 1],
        [-1, -2],
        [1, 3, 4],
      ]
    }]

    for (const { text, examples } of primitives) {
      describe(`> for ${text}`, () => {

        describe("> when elements length unequal", () => {
          it("> returns false", () => {
            expect(arrayOfPrimitiveEqual(examples[0], examples[3])).toBeFalse()
            expect(arrayOfPrimitiveEqual(examples[3], examples[0])).toBeFalse()
          })
        })

        describe("> when element element unequal", () => {
          it("> returns false", () => {
            expect(arrayOfPrimitiveEqual(examples[0], examples[2])).toBeFalse()
            expect(arrayOfPrimitiveEqual(examples[2], examples[0])).toBeFalse()
          })
        })

        describe("> when elementwise equal", () => {
          it("> returns true", () => {
            expect(arrayOfPrimitiveEqual(examples[0], examples[1])).toBeTrue()
            expect(arrayOfPrimitiveEqual(examples[1], examples[0])).toBeTrue()
          })
        })
      })
    }
  })
})
