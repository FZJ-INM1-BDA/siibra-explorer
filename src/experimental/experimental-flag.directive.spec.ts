import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { ExperimentalFlagDirective } from './experimental-flag.directive';
import { TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { userPreference } from 'src/state';
import { take } from 'rxjs/operators';

/**
 * flag, decprecated, experimental, expected
 */
const expectationMatrix = [
  /**
   * dep:same as experiment, experimental takes precedent
   */
  [false, false, false, true],
  [true, false, false, false],
  [false, true, true, false],
  [true, true, true, true],

  /**
   * dep:true, expmt: false, visible when flag not set
   */
  [false, true, false, true],
  [true, true, false, false],

  
  /**
   * dep:false, expmt: true, visible when flag set
   */
  [false, false, true, false],
  [true, false, true, true],
  
  
  /**
   * dep:null, expmt: null, should not emit
   */
  [false, null, null, null],
  [true, null, null, null],
]

describe('ExperimentalFlagDirective', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideMockStore()
      ],
      declarations: [
        ExperimentalFlagDirective
      ]
    })
    const store = TestBed.inject(MockStore)
    store.overrideSelector(userPreference.selectors.showExperimental, null)
  })
  it('should create an instance', () => {
    const store = TestBed.inject(Store)
    const directive = new ExperimentalFlagDirective(store);
    expect(directive).toBeTruthy();
  });

  for (const [flag, dep, exp, expected] of expectationMatrix) {

    describe(`> experimentalFlag: ${flag}`, () => {
      beforeEach(() => {
        const store = TestBed.inject(MockStore)
        store.overrideSelector(userPreference.selectors.showExperimental, flag)
      })
      describe(`> deprecated: ${dep}, experimental: ${exp}`, () => {
        let directive: ExperimentalFlagDirective
        beforeEach(() => {
          const store = TestBed.inject(Store)
          directive = new ExperimentalFlagDirective(store);
          if (dep !== null) directive.deprecated = dep
          if (exp !== null) directive.experimental = exp
        })
        
        it(`show$ should be ${expected}`, async () => {
          if (expected === null) {
            await expectAsync(
              directive.show$.pipe(
                take(1)
              ).toPromise()
            ).toBePending()
            return
          }
          const result = await directive.show$.pipe(
            take(1)
          ).toPromise()

          expect(result).toEqual(expected)
        })
      })
    })
  }
});
