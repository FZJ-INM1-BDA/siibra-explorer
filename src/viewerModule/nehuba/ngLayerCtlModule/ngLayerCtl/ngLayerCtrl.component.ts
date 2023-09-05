import { ChangeDetectionStrategy, Component, Inject, Input, OnChanges, OnDestroy } from "@angular/core";
import { Store } from "@ngrx/store";
import { isMat4 } from "common/util"
import { CONST } from "common/constants"
import { Observable } from "rxjs";
import { atlasAppearance, atlasSelection } from "src/state";
import { NehubaViewerUnit, NEHUBA_INSTANCE_INJTKN } from "src/viewerModule/nehuba";
import { getExportNehuba } from "src/util/fn";
import { getShader } from "src/util/constants";
import { EnumColorMapName } from "src/util/colorMaps";

type Vec4 = [number, number, number, number]
type Mat4 = [Vec4, Vec4, Vec4, Vec4]

export const idMat4: Mat4 = [
  [1, 0, 0, 0],
  [0, 1, 0, 0],
  [0, 0, 1, 0],
  [0, 0, 0, 1],
]

@Component({
  selector: 'ng-layer-ctl',
  templateUrl: './ngLayerCtrl.template.html',
  styleUrls: [
    './ngLayerCtrl.style.css'
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class NgLayerCtrlCmp implements OnChanges, OnDestroy{

  public CONST = CONST

  private onDestroyCb: (() => void)[] = []
  private removeLayer: () => void

  public hideNgTuneCtrl = ''
  public defaultOpacity = 1

  @Input('ng-layer-ctrl-show')
  public showOpacityCtrl = false

  @Input('ng-layer-ctl-name')
  name: string

  @Input('ng-layer-ctl-src')
  source: string

  @Input('ng-layer-ctl-shader')
  shader: string

  opacity: number = 1.0
  @Input('ng-layer-ctl-opacity')
  set _opacity(val: number | string) {
    if (typeof val === 'number') {
      this.opacity = val
      return
    }
    this.opacity = Number(val)
  }
  
  transform: Mat4 = idMat4

  @Input('ng-layer-ctl-transform')
  set _transform(xform: string | Mat4 | number[][]) {
    const parsedResult = typeof xform === "string"
      ? JSON.parse(xform)
      : xform
    if (!isMat4(xform)) {
      return
    }
    this.transform = parsedResult as Mat4
  }

  @Input('ng-layer-ctl-info')
  info: Record<string, any>

  visible: boolean = true
  private viewer: NehubaViewerUnit

  private exportNehuba: any

  constructor(
    private store: Store<any>,
    @Inject(NEHUBA_INSTANCE_INJTKN) nehubaViewer$: Observable<NehubaViewerUnit>
  ){
    const sub = nehubaViewer$.subscribe(v => this.viewer = v)
    this.onDestroyCb.push(
      () => sub.unsubscribe()
    )

    getExportNehuba().then(exportNehuba => {
      this.exportNehuba = exportNehuba
      this.setOrientation()
    })
  }

  ngOnDestroy(): void {
    while(this.onDestroyCb.length > 0) this.onDestroyCb.pop()()
    if (this.removeLayer) {
      this.removeLayer()
      this.removeLayer = null
    }
  }

  ngOnChanges(): void {
    if (this.name && this.source) {
      const { name } = this
      if (this.removeLayer) {
        this.removeLayer()
        this.removeLayer = null
      }
      console.log('foo', this.source)
      this.store.dispatch(
        atlasAppearance.actions.addCustomLayer({
          customLayer: {
            id: name,
            shader: this.shader,
            transform: this.transform,
            clType: 'customlayer/nglayer',
            source: `precomputed://${this.source}`,
            opacity: this.opacity,
          }
        })
      )
      this.removeLayer = () => {
        this.store.dispatch(
          atlasAppearance.actions.removeCustomLayer({
            id: name
          })
        )
      }
    }
  }

  setOrientation(): void {
    const { mat4, quat, vec3 } = this.exportNehuba

    /**
     * glMatrix seems to store the matrix in transposed format
     */
    
    const incM = mat4.transpose(mat4.create(), mat4.fromValues(...this.transform.reduce((acc, curr) => [...acc, ...curr], [])))
    const scale = mat4.getScaling(vec3.create(), incM)
    const scaledM = mat4.scale(mat4.create(), incM, vec3.inverse(vec3.create(), scale))
    const q = mat4.getRotation(quat.create(0), scaledM)

    let position: number[]
    if (this.info) {
      const { scales } = this.info
      const sizeInNm = [0, 1, 2].map(idx => scales[0].size[idx] * scales[0].resolution[idx])
      const start = vec3.transformMat4(vec3.create(), vec3.fromValues(0, 0, 0), incM)
      const end = vec3.transformMat4(vec3.create(), vec3.fromValues(...sizeInNm), incM)
      const final = vec3.add(vec3.create(), start, end)
      vec3.scale(final, final, 0.5)
      position = Array.from(final)
    }
    
    
    this.store.dispatch(
      atlasSelection.actions.navigateTo({
        navigation: {
          orientation: Array.from(q),
          position,
        },
        animation: true
      })
    )
  }

  toggleVisibility(): void{
    this.visible = !this.visible
    this.viewer.nehubaViewer.ngviewer.layerManager.getLayerByName(this.name).setVisible(this.visible)
  }
}
