import { Component } from "@angular/core";
import { TestBed, fakeAsync } from "@angular/core/testing";
import { CommonModule } from "@angular/common";
import { By } from "@angular/platform-browser";
import { FabSpeedDialService } from "./fabSpeedDial.service";
import { FabSpeedDialChild } from "./fabSpeedDialChild.directive";
import { of, BehaviorSubject } from "rxjs";

@Component({
  template: ''
})

class TestCmp{}

describe('FabSpeedDialTrigger', () => {

  let openState$: BehaviorSubject<boolean>
  beforeEach(() => {
    openState$ = new BehaviorSubject(false)
    const fabServiceFactory = () => {
      
      return {
        openState$,
        scaleOrigin$: of('center')
      }
    }

    TestBed.configureTestingModule({
      imports: [
        CommonModule
      ],
      declarations: [
        FabSpeedDialChild,
        TestCmp,
      ],
      providers: [
        {
          provide: FabSpeedDialService,
          useFactory: fabServiceFactory
        }
      ]
    })
  })

  it('should instantiate directive', () => {

    TestBed.overrideComponent(TestCmp, {
      set: {
        template: `
          <div iav-fab-speed-dial-child>
            Test
          </div>
        `
      }
    }).compileComponents()

    const fixture = TestBed.createComponent(TestCmp)
    const directive = fixture.debugElement.query( By.directive( FabSpeedDialChild ) )
    expect(directive).not.toBeNull()
  })

  it('oninit, should be closed', fakeAsync(() => {
    TestBed.overrideComponent(TestCmp, {
      set: {
        template: `
          <div iav-fab-speed-dial-child>
            Test
          </div>
        `
      }
    }).compileComponents()

    const fixture = TestBed.createComponent(TestCmp)
    fixture.detectChanges()

    const directive = fixture.debugElement.query( By.directive( FabSpeedDialChild ) )
    expect(directive.nativeElement.style.transform).toEqual(`scale(0)`)
  }))


  it('should open/close on openState$ change', fakeAsync(() => {
    TestBed.overrideComponent(TestCmp, {
      set: {
        template: `
          <div iav-fab-speed-dial-child>
            Test
          </div>
        `
      }
    }).compileComponents()

    const fixture = TestBed.createComponent(TestCmp)
    fixture.detectChanges()

    const directive = fixture.debugElement.query( By.directive( FabSpeedDialChild ) )
    
    openState$.next(true)
    fixture.detectChanges()
    
    expect(directive.nativeElement.style.transform).toEqual(`scale(1)`)

  }))
})