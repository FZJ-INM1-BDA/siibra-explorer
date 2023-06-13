import { TestBed, fakeAsync, tick, flush, ComponentFixture } from '@angular/core/testing'
import { SaneUrl } from './saneUrl.component'
import { By } from '@angular/platform-browser'
import { NoopAnimationsModule } from '@angular/platform-browser/animations'
import { SaneUrlSvc } from './saneUrl.service'
import { AngularMaterialModule } from 'src/sharedModules'
import { CUSTOM_ELEMENTS_SCHEMA, Directive } from '@angular/core'
import { of, throwError } from 'rxjs'
import { NotFoundError } from '../type'
import { ReactiveFormsModule } from '@angular/forms'
import { CommonModule } from '@angular/common'

const inputCss = `input[aria-label="Custom link"]`
const submitCss = `button[aria-label="Create custom link"]`
const copyBtnCss = `button[aria-label="Copy created custom URL to clipboard"]`

@Directive({
  selector: '[iav-auth-auth-state]',
  exportAs: 'iavAuthAuthState'
})

class AuthStateDummy {
  user$ = of(null)
}

describe('> saneUrl.component.ts', () => {
  describe('> SaneUrl', () => {
    const mockSaneUrlSvc = {
      saneUrlroot: 'saneUrlroot',
      getKeyVal: jasmine.createSpy('getKeyVal'),
      setKeyVal: jasmine.createSpy('setKeyVal'),
    }
    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [
          NoopAnimationsModule,
          AngularMaterialModule,
          ReactiveFormsModule,
        ],
        providers: [
          {
            provide: SaneUrlSvc,
            useValue: mockSaneUrlSvc
          }
        ],
        declarations: [
          SaneUrl,
          AuthStateDummy
        ],
        schemas: [
          CUSTOM_ELEMENTS_SCHEMA
        ]
      }).compileComponents()

      mockSaneUrlSvc.getKeyVal.and.returnValue(
        of('foo-bar')
      )
      mockSaneUrlSvc.setKeyVal.and.returnValue(
        of('OK')
      )
    })

    afterEach(() => {
      mockSaneUrlSvc.getKeyVal.calls.reset()
      mockSaneUrlSvc.setKeyVal.calls.reset()
    })

    it('> can be created', () => {
      const fixture = TestBed.createComponent(SaneUrl)
      const el = fixture.debugElement.componentInstance
      expect(el).toBeTruthy()
    })

    it('> all elements exist', () => {
      const fixture = TestBed.createComponent(SaneUrl)

      const input = fixture.debugElement.query( By.css( inputCss ) )
      expect(input).toBeTruthy()

      const submit = fixture.debugElement.query( By.css( submitCss ) )
      expect(submit).toBeTruthy()

      const cpyBtn = fixture.debugElement.query( By.css( copyBtnCss ) )
      expect(cpyBtn).toBeFalsy()
    })

    it('> catches invalid input syncly', fakeAsync(() => {

      const failValue = `test-1`

      // Necessary to detectChanges, or formControl will not initialise properly
      // See https://stackoverflow.com/a/56600762/6059235
      const fixture = TestBed.createComponent(SaneUrl)
      fixture.detectChanges()

      // Set fail value
      fixture.componentInstance.customUrl.setValue(failValue)

      // Expect validator to fail catch it
      expect(fixture.componentInstance.customUrl.invalid).toEqual(true)

      // on change detection, UI should catch it
      fixture.detectChanges()

      const input = fixture.debugElement.query( By.css( inputCss ) )

    }))

    it('> when user inputs valid input, does not not invalidate', () => {

      const successValue = `test_1`

      // Necessary to detectChanges, or formControl will not initialise properly
      // See https://stackoverflow.com/a/56600762/6059235
      const fixture = TestBed.createComponent(SaneUrl)
      fixture.detectChanges()

      // Set fail value
      fixture.componentInstance.customUrl.setValue(successValue)

      // Expect validator to fail catch it
      expect(fixture.componentInstance.customUrl.invalid).toEqual(false)

      // on change detection, UI should catch it
      fixture.detectChanges()

      const input = fixture.debugElement.query( By.css( inputCss ) )
    })

    describe("> on valid input", () => {
      let saneUrlCmp: SaneUrl
      let fixture: ComponentFixture<SaneUrl>
      const stateTobeSaved = 'foo-bar'
      beforeEach(() => {
        // Necessary to detectChanges, or formControl will not initialise properly
        // See https://stackoverflow.com/a/56600762/6059235
        fixture = TestBed.createComponent(SaneUrl)
        saneUrlCmp = fixture.componentInstance
        saneUrlCmp.stateTobeSaved = stateTobeSaved
        fixture.detectChanges()
      })
      it('> on entering string in input, makes debounced GET request', fakeAsync(() => {

        const value = 'test_1'
  
        // Set value
        fixture.componentInstance.customUrl.setValue(value)
  
        tick(500)
  
        expect(mockSaneUrlSvc.getKeyVal).toHaveBeenCalledOnceWith(value)
      }))
  
      describe("> on 200", () => {
        it("> show error", fakeAsync(() => {
  
          const value = 'test_1'
    
          // Set value
          fixture.componentInstance.customUrl.setValue(value)
    
          tick(500)
    
          // Expect validator to fail catch it
          expect(fixture.componentInstance.customUrl.invalid).toEqual(true)
    
          // on change detection, UI should catch it
          fixture.detectChanges()
    
          const input = fixture.debugElement.query( By.css( inputCss ) )
    
          const submit = fixture.debugElement.query( By.css( submitCss ) )
          const disabled = !!submit.attributes['disabled']
          expect(disabled.toString()).toEqual('true')
        }))
      })
  
      describe('> on 404', () => {
        beforeEach(() => {
          mockSaneUrlSvc.getKeyVal.and.returnValue(
            throwError(new NotFoundError('not found'))
          )
        })
        it("> should available", fakeAsync(() => {
  
          const value = 'test_1'
    
          // Set value
          fixture.componentInstance.customUrl.setValue(value)
    
          tick(500)
    
          // Expect validator to fail catch it
          expect(fixture.componentInstance.customUrl.invalid).toEqual(false)
    
          // on change detection, UI should catch it
          fixture.detectChanges()
    
          const input = fixture.debugElement.query( By.css( inputCss ) )
    
          const submit = fixture.debugElement.query( By.css( submitCss ) )
          const disabled = !!submit.attributes['disabled']
          expect(disabled.toString()).toEqual('false')
        }))
      })
  
      describe("> on other error", () => {
        beforeEach(() => {
  
          mockSaneUrlSvc.getKeyVal.and.returnValue(
            throwError(new Error('other errors'))
          )
        })
        it("> show invalid", fakeAsync(() => {
          const value = 'test_1'
    
          // Set value
          fixture.componentInstance.customUrl.setValue(value)
    
          tick(500)
    
          // Expect validator to fail catch it
          expect(fixture.componentInstance.customUrl.invalid).toEqual(true)
    
          // on change detection, UI should catch it
          fixture.detectChanges()
    
          const input = fixture.debugElement.query( By.css( inputCss ) )
    
          const submit = fixture.debugElement.query( By.css( submitCss ) )
          const disabled = !!submit.attributes['disabled']
          expect(disabled.toString()).toEqual('true')
        }))
      })
  
      describe("> on click create link", () => {
        beforeEach(() => {
          mockSaneUrlSvc.getKeyVal.and.returnValue(
            throwError(new NotFoundError('not found'))
          )
        })
        it("> calls correct service function", fakeAsync(() => {
  
          const value = 'test_1'
    
          // Set value
          fixture.componentInstance.customUrl.setValue(value)
    
          tick(500)
    
          fixture.detectChanges()
          flush()
    
          const submit = fixture.debugElement.query( By.css( submitCss ) )
          const disabled = !!submit.attributes['disabled']
          expect(disabled.toString()).toEqual('false')
    
          submit.triggerEventHandler('click', {})
    
          fixture.detectChanges()
    
          const disabledInProgress = !!submit.attributes['disabled']
          expect(disabledInProgress.toString()).toEqual('true')
    
          fixture.detectChanges()
    
          const disabledAfterComplete = !!submit.attributes['disabled']
          expect(disabledAfterComplete.toString()).toEqual('true')
    
          const cpyBtn = fixture.debugElement.query( By.css( copyBtnCss ) )
          expect(cpyBtn).toBeTruthy()
        }))
  
        describe("> on fail", () => {
          beforeEach(() => {
            mockSaneUrlSvc.setKeyVal.and.returnValue(
              throwError(new Error(`some error`))
            )
          })
          it("> show result", fakeAsync(() => {
  
            const value = 'test_1'
      
            // Set value
            fixture.componentInstance.customUrl.setValue(value)
      
            tick(500)
      
            fixture.detectChanges()
      
            const submit = fixture.debugElement.query( By.css( submitCss ) )
            const disabled = !!submit.attributes['disabled']
            expect(disabled.toString()).toEqual('false')
      
            submit.triggerEventHandler('click', {})
      
            fixture.detectChanges()
      
            const disabledInProgress = !!submit.attributes['disabled']
            expect(disabledInProgress.toString()).toEqual('true')
      
            expect(mockSaneUrlSvc.setKeyVal).toHaveBeenCalledOnceWith(value, stateTobeSaved)
            
            fixture.detectChanges()
      
            const input = fixture.debugElement.query( By.css( inputCss ) )
      
          }))
        })
      })
  
    })
  })
})
