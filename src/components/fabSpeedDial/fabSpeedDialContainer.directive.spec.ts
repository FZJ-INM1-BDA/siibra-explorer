import { Component } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { FabSpeedDialContainer } from "./fabSpeedDialContainer.directive";
import { FabSpeedDialService, SCALE_ORIGIN } from "./fabSpeedDial.service";
import { BehaviorSubject } from "rxjs";
import { By } from "@angular/platform-browser";

@Component({
  template: ``
})

class TestCmp{
  public origin = 'center'
}

const dummyServiceFactory = () => {
  return {
    toggle: jasmine.createSpy('toggle'),
    close: jasmine.createSpy('close'),
    open: jasmine.createSpy('open'),
    scaleOrigin$: new BehaviorSubject('center'),
    openState$: new BehaviorSubject(false)
  }
}

describe('FabSpeedDialContainer', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ ],
      declarations: [
        TestCmp,
        FabSpeedDialContainer,
      ],
      providers: [
        {
          provide:FabSpeedDialService,
          useFactory: dummyServiceFactory,
        }
      ]
    }).overrideDirective(FabSpeedDialContainer, {

      /**
       * normally, FabSpeedDialContainer provides its own FabSpeedDialService
       * in tests, override, and provide on a module level
       */
      set: {
        providers: [],
      }
    }).overrideComponent(TestCmp, {
      set: {
        template: `
        <div iav-fab-speed-dial-container
          [iav-fab-speed-dial-scale-origin]="origin">
        </div>
        `
      }
    })
  })

  it('should be able to instantiate', () => {
    TestBed.compileComponents()

    const fixture = TestBed.createComponent(TestCmp)
    const directive = fixture.debugElement.query( By.directive(FabSpeedDialContainer) )
    expect(directive).not.toBeNull()
  })

  it('directive methods should call spy methods', () => {

    TestBed.compileComponents()

    const fixture = TestBed.createComponent(TestCmp)
    const directive = fixture.debugElement.query( By.directive(FabSpeedDialContainer) )
    const directiveInstance = directive.injector.get(FabSpeedDialContainer)
    
    const serviceInstance = TestBed.inject(FabSpeedDialService)

    directiveInstance.toggle()
    expect(serviceInstance.toggle).toHaveBeenCalled()

    directiveInstance.close()
    expect(serviceInstance.close).toHaveBeenCalled()
    
    directiveInstance.open()
    expect(serviceInstance.open).toHaveBeenCalled()
  })

  it('on change, if valid, expect next to be called', () => {
    TestBed.compileComponents()

    const fixture = TestBed.createComponent(TestCmp)
    const dummyService = TestBed.inject(FabSpeedDialService)

    const scaleOriginNextSpy = spyOn(dummyService.scaleOrigin$, 'next').and.callThrough()
    fixture.componentInstance.origin = 'right'
    fixture.detectChanges()
    expect(scaleOriginNextSpy).toHaveBeenCalledWith(SCALE_ORIGIN.RIGHT)
  })

  it('on change, if invalid, expect next to not be called', () => {

    TestBed.compileComponents()

    const fixture = TestBed.createComponent(TestCmp)
    const dummyService = TestBed.inject(FabSpeedDialService)
    
    const scaleOriginNextSpy = spyOn(dummyService.scaleOrigin$, 'next').and.callThrough()
    fixture.componentInstance.origin = 'bananas'
    fixture.detectChanges()
    expect(scaleOriginNextSpy).not.toHaveBeenCalled()
  })

  it('on openstate change, prop isOpen is set', () => {

    TestBed.compileComponents()

    const fixture = TestBed.createComponent(TestCmp)
    const directive = fixture.debugElement.query( By.directive(FabSpeedDialContainer) )
    const directiveInstance = directive.injector.get(FabSpeedDialContainer)
    
    const serviceInstance = TestBed.inject(FabSpeedDialService)

    serviceInstance.openState$.next(true)
    expect(directiveInstance.isOpen).toEqual(true)
  })

  it('on openstate change, openStatechanged emits', () => {

    TestBed.compileComponents()

    const fixture = TestBed.createComponent(TestCmp)
    const directive = fixture.debugElement.query( By.directive(FabSpeedDialContainer) )
    const directiveInstance = directive.injector.get(FabSpeedDialContainer)
    
    const serviceInstance = TestBed.inject(FabSpeedDialService)

    const openStateChangedSpy = spyOn(directiveInstance.openStateChanged, 'emit').and.callThrough()

    serviceInstance.openState$.next(true)

    expect(openStateChangedSpy).toHaveBeenCalledWith(true)
  })

  it('on openstate change with same value, openStateChanged does not emit', () => {

    TestBed.compileComponents()

    const fixture = TestBed.createComponent(TestCmp)
    const directive = fixture.debugElement.query( By.directive(FabSpeedDialContainer) )
    const directiveInstance = directive.injector.get(FabSpeedDialContainer)
    
    const serviceInstance = TestBed.inject(FabSpeedDialService)

    serviceInstance.openState$.next(true)

    const openStateChangedSpy = spyOn(directiveInstance.openStateChanged, 'emit').and.callThrough()

    serviceInstance.openState$.next(true)

    expect(openStateChangedSpy).not.toHaveBeenCalled()
  })
})