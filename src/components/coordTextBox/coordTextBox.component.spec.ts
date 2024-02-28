import { ComponentFixture, TestBed } from "@angular/core/testing"
import { CoordTextBox, Render, isAffine, isTVec4, isTriplet } from "./coordTextBox.component"
import { Component } from "@angular/core"
import { NoopAnimationsModule } from "@angular/platform-browser/animations"

describe("isTriplet", () => {
  describe("> correctly returns true", () => {
    const triplets = [
      [1, 2, 3],
      [0, 0, 0],
      [1e10, -1e10, 0]
    ]
    for (const triplet of triplets){
      it(`> for ${triplet}`, () => {
        expect(
          isTriplet(triplet)
        ).toBeTrue()
      })
    }
  })

  describe("> correctly returns false", () => {
    const notTriplets = [
      [1, 2],
      [1, 2, 3, 4],
      ['foo', 1, 2],
      [NaN, 1, 2],
      [[], 1, 2]
    ]
    for (const notTriplet of notTriplets) {
      it(`> for ${notTriplet}`, () => {
        expect(
          isTriplet(notTriplet)
        ).toBeFalse()
      })
    }
  })
})

describe("isTVec4", () => {
  describe("> correctly returns true", () => {
    const triplets = [
      [1, 2, 3, 4],
      [0, 0, 0, 0],
      [1e10, -1e10, 0, 0]
    ]
    for (const triplet of triplets){
      it(`> for ${triplet}`, () => {
        expect(
          isTVec4(triplet)
        ).toBeTrue()
      })
    }
  })

  describe("> correctly returns false", () => {
    const notTriplets = [
      [1, 2, 3],
      [1, 2, 3, 4, 5],
      ['foo', 1, 2, 3],
      [NaN, 1, 2, 3],
      [[], 1, 2, 3]
    ]
    for (const notTriplet of notTriplets) {
      it(`> for ${notTriplet}`, () => {
        expect(
          isTVec4(notTriplet)
        ).toBeFalse()
      })
    }
  })
})

describe("isAffine", () => {
  describe("> correctly returns true", () => {
    const triplets = [
      [[1, 2, 3, 4], [1, 2, 3, 4], [1, 2, 3, 4], [1, 2, 3, 4]],
      [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
      [[1e10, -1e10, 0, 0], [1e10, -1e10, 0, 0], [1e10, -1e10, 0, 0], [1e10, -1e10, 0, 0]]
    ]
    for (const triplet of triplets){
      it(`> for ${triplet}`, () => {
        expect(
          isAffine(triplet)
        ).toBeTrue()
      })
    }
  })

  describe("> correctly returns false", () => {
    const notTriplets = [
      [[1, 2, 3, 4], [1, 2, 3, 4], [1, 2, 3, 4]],
      [[1, 2, 3, 4], [1, 2, 3, 4], [1, 2, 3, 4], [1, 2, 3, 4], [1, 2, 3, 4]],
      [[1, 2, 3, 4], [1, 2, 3, 4], [1, 2, 3, 4], [1, 2, 3]],
      [[1, 2, 3, 4], [1, 2, 3, 4], [1, 2, 3, 4], [1, 2, 3, 4, 5]],
    ]
    for (const notTriplet of notTriplets) {
      it(`> for ${notTriplet}`, () => {
        expect(
          isAffine(notTriplet)
        ).toBeFalse()
      })
    }
  })
})


describe("CoordTextBox", () => {

  @Component({
    template: ``
  })
  class Dummy {
    coord = [1, 2, 3]
    iden = [
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ]
    translate = [
      [1, 0, 0, 2],
      [0, 1, 0, 4],
      [0, 0, 1, 6],
      [0, 0, 0, 1],
    ]
    scale = [
      [2, 0, 0, 0],
      [0, 4, 0, 0],
      [0, 0, 8, 0],
      [0, 0, 0, 1],
    ]

    render: Render = v => v.map(v => `${v}f`).join(":")
  }

  let fixture: ComponentFixture<Dummy>

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        CoordTextBox,
        NoopAnimationsModule,
      ],
      declarations: [Dummy]
    })
    // not yet compiled
  })
  
  describe("> correct affine inputs", () => {
    describe("> iden", () => {
      beforeEach(async () => {
        await TestBed.overrideComponent(Dummy, {
          set: {
            template: `
            <coordinate-text-input
              [coordinates]="coord"
              [affine]="iden">
            </coordinate-text-input>
            `
          }
        }).compileComponents()
      })

      it("> renders correctly", () => {
        fixture = TestBed.createComponent(Dummy)
        fixture.detectChanges()
        const input = fixture.nativeElement.querySelector('input')
        expect(input.value).toEqual(`1, 2, 3`)
      })
    })
    describe("> translate", () => {
      beforeEach(async () => {
        await TestBed.overrideComponent(Dummy, {
          set: {
            template: `
            <coordinate-text-input
              [coordinates]="coord"
              [affine]="translate">
            </coordinate-text-input>
            `
          }
        }).compileComponents()
      })

      it("> renders correctly", () => {
        fixture = TestBed.createComponent(Dummy)
        fixture.detectChanges()
        const input = fixture.nativeElement.querySelector('input')
        expect(input.value).toEqual(`3, 6, 9`)
      })
    })
    describe("> scale", () => {
      beforeEach(async () => {
        await TestBed.overrideComponent(Dummy, {
          set: {
            template: `
            <coordinate-text-input
              [coordinates]="coord"
              [affine]="scale">
            </coordinate-text-input>
            `
          }
        }).compileComponents()
      })

      it("> renders correctly", () => {
        fixture = TestBed.createComponent(Dummy)
        fixture.detectChanges()
        const input = fixture.nativeElement.querySelector('input')
        expect(input.value).toEqual(`2, 8, 24`)
      })
    })
  })

  describe("> correct render inputs", () => {
    describe("> render", () => {
      beforeEach(async () => {
        await TestBed.overrideComponent(Dummy, {
          set: {
            template: `
            <coordinate-text-input
              [coordinates]="coord"
              [affine]="iden"
              [render]="render">
            </coordinate-text-input>
            `
          }
        }).compileComponents()
      })

      it("> renders correctly", () => {
        fixture = TestBed.createComponent(Dummy)
        fixture.detectChanges()
        const input = fixture.nativeElement.querySelector('input')
        expect(input.value).toEqual(`1f:2f:3f`)
      })
    })
  })
})