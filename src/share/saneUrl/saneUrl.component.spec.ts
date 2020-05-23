import { TestBed, async, fakeAsync, tick, flush } from '@angular/core/testing'
import { ShareModule } from '../share.module'
import { SaneUrl } from './saneUrl.component'
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing'
import { By } from '@angular/platform-browser'
import { BACKENDURL } from 'src/util/constants'
import { NoopAnimationsModule } from '@angular/platform-browser/animations'

const inputCss = `input[aria-label="Custom link"]`
const submitCss = `button[aria-label="Create custom link"]`
const copyBtnCss = `button[aria-label="Copy created custom URL to clipboard"]`

describe('> saneUrl.component.ts', () => {
  describe('> SaneUrl', () => {
    beforeEach(async(() => {
      TestBed.configureTestingModule({
        imports: [
          ShareModule,
          HttpClientTestingModule,
          NoopAnimationsModule,
        ]
      }).compileComponents()
    }))

    afterEach(() => {
      const ctrl = TestBed.inject(HttpTestingController)
      ctrl.verify()
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
      const invalid = input.attributes['aria-invalid']
      expect(invalid.toString()).toEqual('true')

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
      const invalid = input.attributes['aria-invalid']
      expect(invalid.toString()).toEqual('false')
    })

    it('> on entering string in input, makes debounced GET request', fakeAsync(() => {

      const value = 'test_1'

      const httpTestingController = TestBed.inject(HttpTestingController)

      // Necessary to detectChanges, or formControl will not initialise properly
      // See https://stackoverflow.com/a/56600762/6059235
      const fixture = TestBed.createComponent(SaneUrl)
      fixture.detectChanges()

      // Set value
      fixture.componentInstance.customUrl.setValue(value)

      tick(500)

      const req = httpTestingController.expectOne(`${BACKENDURL}saneUrl/${value}`)
      req.flush(200)
    }))

    it('> on 200 response, show error', fakeAsync(() => {
      
      const value = 'test_1'

      const httpTestingController = TestBed.inject(HttpTestingController)

      // Necessary to detectChanges, or formControl will not initialise properly
      // See https://stackoverflow.com/a/56600762/6059235
      const fixture = TestBed.createComponent(SaneUrl)
      fixture.detectChanges()

      // Set value
      fixture.componentInstance.customUrl.setValue(value)

      tick(500)

      const req = httpTestingController.expectOne(`${BACKENDURL}saneUrl/${value}`)
      req.flush('OK')

      // Expect validator to fail catch it
      expect(fixture.componentInstance.customUrl.invalid).toEqual(true)

      // on change detection, UI should catch it
      fixture.detectChanges()

      const input = fixture.debugElement.query( By.css( inputCss ) )
      const invalid = input.attributes['aria-invalid']
      expect(invalid.toString()).toEqual('true')

      const submit = fixture.debugElement.query( By.css( submitCss ) )
      const disabled = !!submit.attributes['disabled']
      expect(disabled.toString()).toEqual('true')
    }))

    it('> on 404 response, show available', fakeAsync(() => {

      const value = 'test_1'

      const httpTestingController = TestBed.inject(HttpTestingController)

      // Necessary to detectChanges, or formControl will not initialise properly
      // See https://stackoverflow.com/a/56600762/6059235
      const fixture = TestBed.createComponent(SaneUrl)
      fixture.detectChanges()

      // Set value
      fixture.componentInstance.customUrl.setValue(value)

      tick(500)

      const req = httpTestingController.expectOne(`${BACKENDURL}saneUrl/${value}`)
      req.flush('some reason', { status: 404, statusText: 'Not Found.' })

      // Expect validator to fail catch it
      expect(fixture.componentInstance.customUrl.invalid).toEqual(false)

      // on change detection, UI should catch it
      fixture.detectChanges()

      const input = fixture.debugElement.query( By.css( inputCss ) )
      const invalid = input.attributes['aria-invalid']
      expect(invalid.toString()).toEqual('false')

      const submit = fixture.debugElement.query( By.css( submitCss ) )
      const disabled = !!submit.attributes['disabled']
      expect(disabled.toString()).toEqual('false')
    }))

    it('> on other error codes, show invalid', fakeAsync(() => {

      const value = 'test_1'

      const httpTestingController = TestBed.inject(HttpTestingController)

      // Necessary to detectChanges, or formControl will not initialise properly
      // See https://stackoverflow.com/a/56600762/6059235
      const fixture = TestBed.createComponent(SaneUrl)
      fixture.detectChanges()

      // Set value
      fixture.componentInstance.customUrl.setValue(value)

      tick(500)

      const req = httpTestingController.expectOne(`${BACKENDURL}saneUrl/${value}`)
      req.flush('some reason', { status: 401, statusText: 'Unauthorised.' })

      // Expect validator to fail catch it
      expect(fixture.componentInstance.customUrl.invalid).toEqual(true)

      // on change detection, UI should catch it
      fixture.detectChanges()

      const input = fixture.debugElement.query( By.css( inputCss ) )
      const invalid = input.attributes['aria-invalid']
      expect(invalid.toString()).toEqual('true')

      const submit = fixture.debugElement.query( By.css( submitCss ) )
      const disabled = !!submit.attributes['disabled']
      expect(disabled.toString()).toEqual('true')
    }))

    it('> on click create link btn calls correct API', fakeAsync(() => {

      const value = 'test_1'

      const httpTestingController = TestBed.inject(HttpTestingController)

      // Necessary to detectChanges, or formControl will not initialise properly
      // See https://stackoverflow.com/a/56600762/6059235
      const fixture = TestBed.createComponent(SaneUrl)
      fixture.detectChanges()

      // Set value
      fixture.componentInstance.customUrl.setValue(value)

      tick(500)

      const req = httpTestingController.expectOne(`${BACKENDURL}saneUrl/${value}`)
      req.flush('some reason', { status: 404, statusText: 'Not Found.' })

      fixture.detectChanges()
      flush()

      const submit = fixture.debugElement.query( By.css( submitCss ) )
      const disabled = !!submit.attributes['disabled']
      expect(disabled.toString()).toEqual('false')

      submit.triggerEventHandler('click', {})

      fixture.detectChanges()

      const disabledInProgress = !!submit.attributes['disabled']
      expect(disabledInProgress.toString()).toEqual('true')

      const req2 = httpTestingController.expectOne({
        method: 'POST',
        url: `${BACKENDURL}saneUrl/${value}`
      })
      
      req2.flush({})

      fixture.detectChanges()

      const disabledAfterComplete = !!submit.attributes['disabled']
      expect(disabledAfterComplete.toString()).toEqual('true')

      const cpyBtn = fixture.debugElement.query( By.css( copyBtnCss ) )
      expect(cpyBtn).toBeTruthy()
    }))

    it('> on click create link btn fails show result', fakeAsync(() => {

      const value = 'test_1'

      const httpTestingController = TestBed.inject(HttpTestingController)

      // Necessary to detectChanges, or formControl will not initialise properly
      // See https://stackoverflow.com/a/56600762/6059235
      const fixture = TestBed.createComponent(SaneUrl)
      fixture.detectChanges()

      // Set value
      fixture.componentInstance.customUrl.setValue(value)

      tick(500)

      const req = httpTestingController.expectOne(`${BACKENDURL}saneUrl/${value}`)
      req.flush('some reason', { status: 404, statusText: 'Not Found.' })

      fixture.detectChanges()
      flush()

      const submit = fixture.debugElement.query( By.css( submitCss ) )
      const disabled = !!submit.attributes['disabled']
      expect(disabled.toString()).toEqual('false')

      submit.triggerEventHandler('click', {})

      fixture.detectChanges()

      const disabledInProgress = !!submit.attributes['disabled']
      expect(disabledInProgress.toString()).toEqual('true')

      const req2 = httpTestingController.expectOne({
        method: 'POST',
        url: `${BACKENDURL}saneUrl/${value}`
      })
      
      req2.flush('Something went wrong', { statusText: 'Wrong status text', status: 500 })

      fixture.detectChanges()

      const input = fixture.debugElement.query( By.css( inputCss ) )
      const invalid = input.attributes['aria-invalid']
      expect(invalid.toString()).toEqual('true')

    }))
  })
})
