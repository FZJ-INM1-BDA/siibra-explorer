import { CommonModule } from "@angular/common";
import { Component, EventEmitter, HostListener, Input, Output, ViewChild, inject } from "@angular/core";
import { BehaviorSubject, combineLatest } from "rxjs";
import { map, shareReplay } from "rxjs/operators";
import { AngularMaterialModule, MatInput } from "src/sharedModules";
import { DestroyDirective } from "src/util/directives/destroy.directive";

type TTriplet = [number, number, number]
type TVec4 = [number, number, number, number]
export type TAffine = [TVec4, TVec4, TVec4, TVec4]
export type Render = (v: TTriplet) => string

export function isTVec4(val: unknown): val is TAffine {
  if (!Array.isArray(val)) {
    return false
  }
  if (val.length !== 4) {
    return false
  }
  return val.every(v => typeof v === "number")
}

export function isAffine(val: unknown): val is TAffine {
  if (!Array.isArray(val)) {
    return false
  }
  if (val.length !== 4) {
    return false
  }
  return val.every(v => isTVec4(v))
}

export function isTriplet(val: unknown): val is TTriplet{
  if (!Array.isArray(val)) {
    return false
  }
  if (val.some(v => typeof v !== "number")) {
    return false
  }
  return val.length === 3
}

@Component({
  selector: 'coordinate-text-input',
  templateUrl: './coordTextBox.template.html',
  styleUrls: [
    './coordTextBox.style.css'
  ],
  standalone: true,
  imports: [
    CommonModule,
    AngularMaterialModule
  ],
  hostDirectives: [
    DestroyDirective
  ]
})

export class CoordTextBox {

  #destroyed$ = inject(DestroyDirective).destroyed$

  @ViewChild(MatInput)
  input: MatInput

  @Output('enter')
  enter = new EventEmitter()

  @HostListener('keydown.enter')
  @HostListener('keydown.tab')
  enterHandler() {
    this.enter.emit()
  }
  
  #coordinates = new BehaviorSubject<TTriplet>([0, 0, 0])

  @Input()
  set coordinates(val: unknown) {
    if (!isTriplet(val)) {
      console.error(`${val} is not TTriplet`)
      return
    }
    this.#coordinates.next(val)
  }

  
  #affine = new BehaviorSubject<TAffine>([
    [1, 0, 0, 0],
    [0, 1, 0, 0],
    [0, 0, 1, 0],
    [0, 0, 0, 1],
  ])

  @Input()
  set affine(val: unknown) {
    if (!isAffine(val)) {
      console.error(`${val} is not TAffine!`)
      return
    }
    this.#affine.next(val)
  }
  
  #render = new BehaviorSubject<Render>(v => v.join(`, `))

  @Input()
  set render(val: Render) {
    this.#render.next(val)
  }

  inputValue$ = combineLatest([
    this.#coordinates,
    this.#affine,
    this.#render,
  ]).pipe(
    map(([ coord, flattenedAffine, render ]) => {
      const [
        [m00, m10, m20, m30],
        [m01, m11, m21, m31],
        [m02, m12, m22, m32],
        // [m03, m13, m23, m33],
      ] = flattenedAffine

      const newCoord: TTriplet = [
        coord[0] * m00 + coord[1] * m10 + coord[2] * m20 + 1 * m30,
        coord[0] * m01 + coord[1] * m11 + coord[2] * m21 + 1 * m31,
        coord[0] * m02 + coord[1] * m12 + coord[2] * m22 + 1 * m32
      ]
      return render(newCoord)
    }),
    shareReplay(1),
  )

  @Input()
  label: string = "Coordinates"

  get inputValue(){
    return this.input?.value
  }
}
