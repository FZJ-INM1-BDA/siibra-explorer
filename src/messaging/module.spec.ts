import { CommonModule } from "@angular/common"
import { Component } from "@angular/core"
import { TestBed } from "@angular/core/testing"
import { provideMockStore } from "@ngrx/store/testing"
import { MesssagingModule } from "./module"
import { IAV_POSTMESSAGE_NAMESPACE } from './service'

@Component({
  template: ''
})
class DummyCmp{}

describe('> module.ts', () => {
  describe('> MesssagingModule', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [
          CommonModule,
          MesssagingModule
        ],
        declarations: [
          DummyCmp
        ],
        providers: [
          provideMockStore()
        ]
      }).compileComponents()
    })

    describe('> service is init', () => {
      let spy: jasmine.Spy
      beforeEach(() => {
      })

      // TODO need to test that module result in service instantiation
      it('> pong is heard', () => {
        // const fixture = TestBed.createComponent(DummyCmp)

        // spy = jasmine.createSpy()
        // window.addEventListener('message', ev => {
        //   console.log('message', ev.data)
        //   if (ev.data.result === 'pong') {
        //     spy()
        //   }
        // })
        // window.postMessage({
        //   method: `${IAV_POSTMESSAGE_NAMESPACE}ping`,
        //   id: '123'
        // }, '*' )
        // expect(spy).toHaveBeenCalled()
      })
    })
  })
})
