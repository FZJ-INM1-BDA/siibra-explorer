import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { ExperimentalFlagDirective } from './experimental-flag.directive';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { userPreference } from 'src/state';
import { Component, Input, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * flag, decprecated, experimental, expected
 */
const expectationMatrix = [
  /**
   * last set will always override previous
   * and since it's a toggle, experimental === !deprecated
   * as a result, the following pairs are equivalent
   */
  [false, false, false, true],
  [false, true, false, true],

  [true, false, false, false],
  [true, true, false, false],

  [false, true, true, false],
  [false, false, true, false],

  [true, true, true, true],
  [true, false, true, true],
  
  
  /**
   * dep:null, expmt: null, should not emit
   */
  [false, null, null, true],
  [true, null, null, true],
]

@Component({
  template: `<ng-template
      sxplrExperimentalFlag
      [experimental]="experimental"
      [deprecated]="deprecated">
      <div id="foobarbuzz"></div>
    </ng-template>`
})
class DummyCmp{
  @Input()
  experimental: boolean

  @Input()
  deprecated: boolean

  @ViewChild(ExperimentalFlagDirective)
  experimentalFlag: ExperimentalFlagDirective
}

describe('ExperimentalFlagDirective', () => {
  let cmp: ComponentFixture<DummyCmp>
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        ExperimentalFlagDirective,
      ],
      providers: [
        provideMockStore()
      ],
      declarations: [
        DummyCmp
      ]
    }).compileComponents()
    
    const store = TestBed.inject(MockStore)
    store.overrideSelector(userPreference.selectors.showExperimental, null)
  })
  it('should create an instance', () => {
    cmp = TestBed.createComponent(DummyCmp)
    expect(cmp.componentInstance).toBeTruthy()
  });

  for (const [flag, dep, exp, expected] of expectationMatrix) {

    describe(`> experimentalFlag: ${flag}`, () => {
      
      beforeEach(fakeAsync( () => {
        const store = TestBed.inject(MockStore)
        store.overrideSelector(userPreference.selectors.showExperimental, flag)
        cmp = TestBed.createComponent(DummyCmp)
        cmp.detectChanges()

        /**
         * only set if set to null
         */
        if (dep !== null) {
          cmp.componentInstance.experimentalFlag.deprecated = dep
        }
        if (exp !== null) {
          cmp.componentInstance.experimentalFlag.experimental = exp
        }
        
        cmp.detectChanges()

        tick(16)
      } ))

      describe(`> deprecated: ${dep}, experimental: ${exp}`, () => {

        it(`ngIf should be ${expected}`, async () => {
          
          const el = cmp.nativeElement.querySelector('#foobarbuzz')
          if (expected) {
            expect(el).toBeTruthy()
          } else {
            expect(el).toBeFalsy()
          }
        })
      })
    })
  }
});
