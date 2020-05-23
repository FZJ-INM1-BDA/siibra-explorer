import { Component, ViewChild } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { FixedMouseContextualContainerDirective } from "./FixedMouseContextualContainerDirective.directive";
import { By } from "@angular/platform-browser";

@Component({
  template: ''
})

class TestCmp{
  @ViewChild(FixedMouseContextualContainerDirective) directive: FixedMouseContextualContainerDirective
}

describe('FixedMouseContextualContainerDirective', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        
      ],
      declarations: [
        TestCmp,
        FixedMouseContextualContainerDirective
      ]
    })
  })

  it('> can instantiate directive properly', () => {
    TestBed.overrideComponent(TestCmp, {
      set: {
        template: `
        <div fixedMouseContextualContainerDirective>
        </div>
        `
      }
    }).compileComponents()

    const fixture = TestBed.createComponent(TestCmp)
    fixture.detectChanges()
    const directive = fixture.debugElement.query( By.directive(FixedMouseContextualContainerDirective) )
    expect(directive).toBeTruthy()

    expect(fixture.componentInstance.directive).toBeTruthy()
  })

  describe('> hides if no content', () => {
    it('> on #show, if content exists, isShown will be true', () => {

      TestBed.overrideComponent(TestCmp, {
        set: {
          template: `
          <div fixedMouseContextualContainerDirective>
            <span>Hello World</span>
          </div>
          `
        }
      }).compileComponents()

      const fixture = TestBed.createComponent(TestCmp)
      fixture.detectChanges()

      const cmp = fixture.componentInstance
      cmp.directive.show()
      fixture.detectChanges()
      expect(cmp.directive.isShown).toBeTrue()
    })

    it('> on #show, if only comment exists, isShown will be false', () => {

      TestBed.overrideComponent(TestCmp, {
        set: {
          template: `
          <div fixedMouseContextualContainerDirective>
            <!-- hello world -->
          </div>
          `
        }
      }).compileComponents()

      const fixture = TestBed.createComponent(TestCmp)
      fixture.detectChanges()

      const cmp = fixture.componentInstance
      cmp.directive.show()
      fixture.detectChanges()
      expect(cmp.directive.isShown).toBeFalse()
    })

    it('> on #show, if only text exists, isShown will be false', () => {

      TestBed.overrideComponent(TestCmp, {
        set: {
          template: `
          <div fixedMouseContextualContainerDirective>
            hello world
          </div>
          `
        }
      }).compileComponents()

      const fixture = TestBed.createComponent(TestCmp)
      fixture.detectChanges()

      const cmp = fixture.componentInstance
      cmp.directive.show()
      fixture.detectChanges()
      expect(cmp.directive.isShown).toBeFalse()
    })

    it('> on #show, if nothing exists, isShown will be false', () => {

      TestBed.overrideComponent(TestCmp, {
        set: {
          template: `
          <div fixedMouseContextualContainerDirective>
          </div>
          `
        }
      }).compileComponents()

      const fixture = TestBed.createComponent(TestCmp)
      fixture.detectChanges()

      const cmp = fixture.componentInstance
      cmp.directive.show()
      fixture.detectChanges()
      expect(cmp.directive.isShown).toBeFalse()
    })
  })

  // TODO complete tests for FixedMouseContextualContainerDirective
})