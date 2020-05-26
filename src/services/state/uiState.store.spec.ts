import { TestBed, async } from "@angular/core/testing"
import { Component, Inject } from "@angular/core"
import { getMouseoverSegmentsFactory } from "./uiState.store"
import { Store } from "@ngrx/store"
import { provideMockStore } from "@ngrx/store/testing"
import { defaultRootState } from "../stateStore.service"

const INJECTION_TOKEN = `INJECTION_TOKEN`

@Component({
  template: ''
})
class TestCmp{
  constructor(
    @Inject(INJECTION_TOKEN) public getMouseoverSegments: Function
  ){

  }
}

const dummySegment = {
  layer: {
    name: 'apple'
  },
  segment: {
    hello: 'world'
  }
}

describe('getMouseoverSegmentsFactory', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        TestCmp
      ],
      providers: [
        {
          provide: INJECTION_TOKEN,
          useFactory: getMouseoverSegmentsFactory,
          deps: [ Store ]
        },
        provideMockStore({
          initialState: {
            ...defaultRootState,
            uiState: {
              ...defaultRootState.uiState,
              mouseOverSegments: [ dummySegment ]
            }
          }
        })
      ]
    }).compileComponents()
  }))

  it('should compile component', () => {
    const fixture = TestBed.createComponent(TestCmp)
    expect(fixture).toBeTruthy()
  })

  it('function should return dummy segment', () => {
    const fixutre = TestBed.createComponent(TestCmp)
    const result = fixutre.componentInstance.getMouseoverSegments()
    expect(result).toEqual([dummySegment])
  })
})