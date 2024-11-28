import { Directive, Input } from "@angular/core";
import { BehaviorSubject, combineLatest } from "rxjs";
import { map, shareReplay } from "rxjs/operators";

type TTriplet = [number, number, number]
type TVec4 = [number, number, number, number]
export type TAffine = [TVec4, TVec4, TVec4, TVec4]
export type Render = (v: number[]) => string

export function isTVec4(val: unknown): val is TAffine {
  if (!Array.isArray(val)) {
    return false
  }
  if (val.length !== 4) {
    return false
  }
  return val.every(v => typeof v === "number" && !isNaN(v))
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
  if (val.length !== 3) {
    return false
  }
  return val.every(v => typeof v === "number" && !isNaN(v))
}

@Directive({
  selector: '[coordinate-text]',
  standalone: true,
  exportAs: 'coordinateText'
})

export class CoordinateText {

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
}
