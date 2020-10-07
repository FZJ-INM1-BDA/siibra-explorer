import { Component, ViewChild } from "@angular/core"
import { async, TestBed } from "@angular/core/testing"
import { By } from "@angular/platform-browser"
import { SafeStylePipe } from "src/util/pipes/safeStyle.pipe"
import { HOVER_COLOR, LandmarkUnit, NORMAL_COLOR } from "./landmarkUnit.component"


/**
 * need to use a dummy component for input/ngOnChanges life cycle hook to be called properly
 * see https://github.com/angular/angular/issues/35614
 */
@Component({
  template: `
  <nehuba-2dlandmark-unit
    [positionX]="positionX"
    [positionY]="positionY"
    [positionZ]="positionZ"
    [color]="color"
    [highlight]="highlight"
    [flatProjection]="flatProjection"
    [fasClass]="fasClass" 
    >
  </nehuba-2dlandmark-unit>
  `
})
class DummyCmp{
  @ViewChild(LandmarkUnit) public landmarkUnit: LandmarkUnit

  public positionX: number = 0
  public positionY: number = 0
  public positionZ: number = 0
  public color: [number, number, number] // = NORMAL_COLOR as [number, number, number]
  public highlight: boolean = false
  public flatProjection: boolean = false
  public fasClass: string = 'fa-map-marker'
}

describe('> landmarkUnit.component.ts', () => {
  describe('> LandmarkUnit', () => {
    beforeEach(async(() => {
      TestBed.configureTestingModule({
        declarations: [
          DummyCmp,
          LandmarkUnit,
          SafeStylePipe
        ]
      }).compileComponents()
    }))

    it('> should be able to be created', () => {
      const fixture = TestBed.createComponent(DummyCmp)
      fixture.detectChanges()
      const el = fixture.debugElement.componentInstance
      expect(el.landmarkUnit).toBeTruthy()
    })

    describe('> color', () => {

      describe('> without any color inputs', () => {

        it('> at rest, NORMAL_COLOR will be used', () => {
          const fixture = TestBed.createComponent(DummyCmp)
          const el = fixture.debugElement.componentInstance
          fixture.detectChanges()
          const lmUnit = el.landmarkUnit
          fixture.detectChanges()
          expect(lmUnit.nodeStyle).toEqual({
            color: `rgb(${NORMAL_COLOR.join(',')})`,
            'z-index': 0
          })
        })
  
        it('> if highlight is set to true, HOVER_COLOR will be used', () => {
          
          const fixture = TestBed.createComponent(DummyCmp)
          const el = fixture.debugElement.componentInstance
          fixture.detectChanges()
          const lmUnit = el.landmarkUnit
          el.highlight = true
          fixture.detectChanges()
          expect(lmUnit.nodeStyle).toEqual({
            color: `rgb(${HOVER_COLOR.join(',')})`,
            'z-index': 0
          })
        })
      })

      describe('> color input is defined', () => {
        const INPUT_COLOR = [123,233, 100]

        it('> at rest, INPUT_COLOR will be used', () => {
          const fixture = TestBed.createComponent(DummyCmp)
          const el = fixture.debugElement.componentInstance
          fixture.detectChanges()
          el.color = INPUT_COLOR
          const lmUnit = el.landmarkUnit
          fixture.detectChanges()
          expect(lmUnit.nodeStyle).toEqual({
            color: `rgb(${INPUT_COLOR.join(',')})`,
            'z-index': 0
          })
        })
  
        it('> if highlight is set to true, HOVER_COLOR will be used', () => {
          
          const fixture = TestBed.createComponent(DummyCmp)
          const el = fixture.debugElement.componentInstance
          fixture.detectChanges()
          el.color = INPUT_COLOR
          const lmUnit = el.landmarkUnit
          el.highlight = true
          fixture.detectChanges()
          expect(lmUnit.nodeStyle).toEqual({
            color: `rgb(${HOVER_COLOR.join(',')})`,
            'z-index': 0
          })
        })
      })
    })
  })
})