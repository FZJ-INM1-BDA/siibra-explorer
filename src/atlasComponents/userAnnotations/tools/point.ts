import { AbsToolClass, IAnnotationEvents, IAnnotationGeometry, IAnnotationTools, INgAnnotationTypes, TAnnotationEvent, TNgAnnotationEv, TToolType } from "./type";
import { Observable, Subject } from "rxjs";

export class Point extends IAnnotationGeometry {
  id: string
  x: number
  y: number
  z: number

  static threshold = 1e-6
  static eql(p1: Point, p2: Point) {
    return Math.abs(p1.x - p2.x) < Point.threshold
      && Math.abs(p1.y - p2.y) < Point.threshold
      && Math.abs(p1.z - p2.z) < Point.threshold
  }
  constructor(arr: number[] = [], id?: string){
    super({id})
    if (arr.length !== 3) throw new Error(`constructor of points must be length 3`)
    this.x = arr[0]
    this.y = arr[1]
    this.z = arr[2]
  }
  toJSON(){
    const { id, x, y, z } = this
    return { id, x, y, z }
  }
  toNgAnnotation(): INgAnnotationTypes['point'][]{
    return [{
      id: this.id,
      point: [this.x, this.y, this.z],
      type: 'point',
    }]
  }
  static fromJSON(json: any) {
    const { x, y, z, id } = json
    return new Point([x, y, z], id)
  }

  public translate(x: number, y: number, z: number) {
    this.x += x
    this.y += y
    this.z += z
  }
}

export class ToolPoint extends AbsToolClass implements IAnnotationTools {
  static PREVIEW_ID='tool_point_preview'
  public name = 'Point'
  public toolType: TToolType = 'drawing'
  public iconClass = 'fas fa-circle'
  private managedAnnotations: Point[] = []
  public allNgAnnotations$ = new Subject<INgAnnotationTypes[keyof INgAnnotationTypes][]>()
  constructor(
    annotationEv$: Observable<TAnnotationEvent<keyof IAnnotationEvents>>
  ){
    super(annotationEv$)
  }

  onMouseMoveRenderPreview(pos: [number, number, number]) {
    return [{
      id: `${ToolPoint.PREVIEW_ID}_0`,
      point: pos,
      type: 'point',
      description: ''
    }] as INgAnnotationTypes['point'][]
  }

  ngAnnotationIsRelevant(annotation: TNgAnnotationEv){
    return this.managedAnnotations.some(p => p.id === annotation.pickedAnnotationId)
  }
}
