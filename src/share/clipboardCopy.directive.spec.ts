import { Component } from "@angular/core";
import { async, TestBed } from "@angular/core/testing";
import { AngularMaterialModule } from "src/ui/sharedModules/angularMaterial.module";
import { ClipboardCopy } from "./clipboardCopy.directive";
import { By } from "@angular/platform-browser";
import { Clipboard } from "@angular/cdk/clipboard";

@Component({
  template: ''
})

class TestCmp{}

const dummyClipBoard = {
  copy: val => {
    
  }
}

describe('clipboardCopy.directive.ts', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        AngularMaterialModule
      ],
      declarations: [
        ClipboardCopy,
        TestCmp
      ],
      providers:[
        {
          provide: Clipboard,
          useValue: dummyClipBoard
        }
      ]
    })

    // not yet compiled!
  }))

  it('should be able to test directive', async(() => {
    TestBed.overrideComponent(TestCmp, {
      set: {
        template: '<div iav-clipboard-copy></div>'
      }
    }).compileComponents()

    const fixture = TestBed.createComponent(TestCmp)
    const directive = fixture.debugElement.query( By.directive( ClipboardCopy ) )
    expect(directive).not.toBeNull()
  }))

  it('if copytarget is not defined, window.location.href will be copied', async(() => {
    
    const testPath = 'http://TESTHOST/TESTPATH'
    const spy = spyOn(ClipboardCopy, 'getWindowLocationHref').and.returnValue(testPath)
    const clipboardSpy = spyOn(dummyClipBoard, 'copy')
    TestBed.overrideComponent(TestCmp, {
      set: {
        template: '<div iav-clipboard-copy></div>'
      }
    }).compileComponents()

    const fixture = TestBed.createComponent(TestCmp)
    const directive = fixture.debugElement.query( By.directive( ClipboardCopy ) )

    directive.triggerEventHandler('click', null)
    expect(spy).toHaveBeenCalled()
    expect(clipboardSpy).toHaveBeenCalledWith(testPath)
  }))

  it('if copytarget is provided, copytarget will be copied', () => {

    const copyTarget = 'hello world'
    const spy = spyOn(ClipboardCopy, 'getWindowLocationHref').and.returnValue('testPath')
    const clipboardSpy = spyOn(dummyClipBoard, 'copy')
    TestBed.overrideComponent(TestCmp, {
      set: {
        template: `<div iav-clipboard-copy="${copyTarget}"></div>`
      }
    }).compileComponents()

    const fixture = TestBed.createComponent(TestCmp)
    fixture.detectChanges()
    const directive = fixture.debugElement.query( By.directive( ClipboardCopy ) )
    
    directive.triggerEventHandler('click', null)
    expect(spy).not.toHaveBeenCalled()
    expect(clipboardSpy).toHaveBeenCalledWith(copyTarget)
  })
})
