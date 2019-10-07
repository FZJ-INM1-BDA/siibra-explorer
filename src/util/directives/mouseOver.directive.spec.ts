import { temporalPositveScanFn } from './mouseOver.directive'
import { Subject } from 'rxjs';
import {} from 'jasmine'
import { scan, take, skip } from 'rxjs/operators';

const segmentsPositive = { segments: [{ hello: 'world' }] } as {segments:any}
const segmentsNegative = { segments: null }

const userLandmarkPostive = { userLandmark: true }
const userLandmarkNegative = { userLandmark: null }

describe('temporalPositveScanFn', () => {
  const subscriptions = []
  afterAll(() => {
    while(subscriptions.length > 0) subscriptions.pop().unsubscribe()
  })

  it('should scan obs as expected', (done) => {

    const source = new Subject()

    const testFirstEv = source.pipe(
      scan(temporalPositveScanFn, []),
      take(1)
    )

    const testSecondEv = source.pipe(
      scan(temporalPositveScanFn, []),
      skip(1),
      take(1)
    )

    const testThirdEv = source.pipe(
      scan(temporalPositveScanFn, []),
      skip(2),
      take(1)
    )
    subscriptions.push(
      testFirstEv.subscribe(
        arr => expect(arr).toBe([ segmentsPositive ]),
        null,
        () => done()
      )
    )

    source.next(segmentsPositive)
    source.next(userLandmarkPostive)
    source.next(segmentsNegative)
  })
})
