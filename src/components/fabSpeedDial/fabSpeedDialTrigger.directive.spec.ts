import { Component } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { CommonModule } from "@angular/common";
import { FabSpeedDialTrigger } from "./fabSpeedDialTrigger.directive";
import { By } from "@angular/platform-browser";
import { FabSpeedDialService } from "./fabSpeedDial.service";


@Component({
  template: ''
})

class TestCmp{}

const mockFabService = {
  toggle: jasmine.createSpy('toggle')
}

describe('FabSpeedDialTrigger', () => {

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        CommonModule
      ],
      declarations: [
        FabSpeedDialTrigger,
        TestCmp,
      ],
      providers: [
        {
          provide: FabSpeedDialService,
          useValue: mockFabService,
        }
      ]
    })
  })

  it('should instantiate directive', () => {
    TestBed.overrideComponent(TestCmp, {
      set: {
        template: `
          <div iav-fab-speed-dial-trigger>
            Test
          </div>
        `
      }
    }).compileComponents()

    const fixture = TestBed.createComponent(TestCmp)
    const directive = fixture.debugElement.query( By.directive( FabSpeedDialTrigger ) )
    expect(directive).not.toBeNull()
  })

  it('onclick, should call toggle', () => {
    TestBed.overrideComponent(TestCmp, {
      set: {
        template: `
          <div iav-fab-speed-dial-trigger>
            Test
          </div>
        `
      }
    }).compileComponents()

    const fixture = TestBed.createComponent(TestCmp)
    const directive = fixture.debugElement.query( By.directive( FabSpeedDialTrigger ) )
    
    directive.nativeElement.click()

    expect(mockFabService.toggle).toHaveBeenCalled()
  })
})