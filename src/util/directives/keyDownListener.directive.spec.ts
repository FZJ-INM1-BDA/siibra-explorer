import { DOCUMENT } from "@angular/common"
import { Component } from "@angular/core"
import { ComponentFixture, fakeAsync, TestBed, tick } from "@angular/core/testing"
import { By } from "@angular/platform-browser"
import { KeyListenerConfig, KeyListner } from "./keyDownListener.directive"

@Component({
  template: ``
})

class DummyCmp{
  public keyConfig: KeyListenerConfig[]=[{
    type: 'keydown',
    key: 'a',
  },{
    type: 'keyup',
    key: 'a',
  },{
    type: 'keydown',
    key: 'd',
    target: 'document',
    capture: true
  },{
    type: 'keydown',
    key: 'e',
    target: 'document'
  }]

  // will get spied on
  public listener(event: any){
    console.log('lister called')
  }
}

const inputId = `text-input`
describe('KeyListner', () => {
  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [],
      declarations: [
        KeyListner,
        DummyCmp
      ],
    }).overrideComponent(DummyCmp, {
      set: {
        template: `
        <div><input id="${inputId}"></div>
        <div>
          <div
            [iav-key-listener]="keyConfig"
            (iav-key-event)="listener($event)">
          </div>
        </div>
        `
      }
    })

    await TestBed.compileComponents()
  })

  it('> creates component just fine', () => {
    const fixture = TestBed.createComponent(DummyCmp)
    expect(fixture).toBeTruthy()
  })
  it('> Directive is created', () => {
    const fixture = TestBed.createComponent(DummyCmp)
    const keyListenerDirective = fixture.debugElement.query(By.directive(KeyListner))
    expect(keyListenerDirective).toBeTruthy()
  })

  describe('> directive working as intended', () => {
    let eventListSpy: jasmine.Spy
    let fixture: ComponentFixture<DummyCmp>
    beforeEach(() => {
      fixture = TestBed.createComponent(DummyCmp)
      eventListSpy = spyOn(fixture.componentInstance, 'listener')
      fixture.detectChanges()
    })
    describe('> if dispatch element was host element', () => {
      it('> should trigger event', () => {
        const newKeybEv = new KeyboardEvent('keydown', {
          key: 'd'
        })
        const nativeEl = fixture.nativeElement as HTMLElement
        nativeEl.dispatchEvent(newKeybEv)
        
        expect(eventListSpy).toHaveBeenCalled()
      })
    })
    describe('> if dispatch element was input', () => {
      it('> should not trigger event listener', () => {
        const newKeybEv = new KeyboardEvent('keydown', {
          key: 'd'
        })
        const nativeEl = fixture.debugElement.query(By.css(`#${inputId}`)).nativeElement as HTMLElement
        nativeEl.dispatchEvent(newKeybEv)
        
        expect(eventListSpy).not.toHaveBeenCalled()
      })
    })
  })
})
