import {} from 'jasmine'
import { forkJoin, Subject } from 'rxjs';
import { scan, skip, take } from 'rxjs/operators';
import { temporalPositveScanFn } from './util'

const segmentsPositive = { segments: [{ hello: 'world' }] } as {segments: any}
const segmentsNegative = { segments: [] }

const userLandmarkPostive = { userLandmark: true }
const userLandmarkNegative = { userLandmark: null }

describe('temporalPositveScanFn', () => {
  const subscriptions = []
  afterAll(() => {
    while (subscriptions.length > 0) { subscriptions.pop().unsubscribe() }
  })

  it('should scan obs as expected', (done) => {

    const source = new Subject()

    const testFirstEv = source.pipe(
      scan(temporalPositveScanFn, []),
      take(1),
    )

    const testSecondEv = source.pipe(
      scan(temporalPositveScanFn, []),
      skip(1),
      take(1),
    )

    const testThirdEv = source.pipe(
      scan(temporalPositveScanFn, []),
      skip(2),
      take(1),
    )

    const testFourthEv = source.pipe(
      scan(temporalPositveScanFn, []),
      skip(3),
      take(1),
    )

    forkJoin([
      testFirstEv,
      testSecondEv,
      testThirdEv,
      testFourthEv,
    ]).pipe(
      take(1),
    ).subscribe(([ arr1, arr2, arr3, arr4 ]) => {
      expect(arr1).toEqual([ segmentsPositive ])
      expect(arr2).toEqual([ userLandmarkPostive, segmentsPositive ])
      expect(arr3).toEqual([ userLandmarkPostive ])
      expect(arr4).toEqual([])
    }, null, () => done() )

    source.next(segmentsPositive)
    source.next(userLandmarkPostive)
    source.next(segmentsNegative)
    source.next(userLandmarkNegative)
  })
})
