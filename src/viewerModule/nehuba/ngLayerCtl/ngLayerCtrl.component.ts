import { ChangeDetectionStrategy, Component, Inject, Input, OnChanges, OnDestroy, SimpleChanges } from "@angular/core";
import { Store } from "@ngrx/store";
import { isMat4 } from "common/util"
import { Observable } from "rxjs";
import { ngViewerActionAddNgLayer, ngViewerActionRemoveNgLayer } from "src/services/state/ngViewerState.store.helper";
import { NehubaViewerUnit } from "..";
import { NEHUBA_INSTANCE_INJTKN } from "../util";

type Vec4 = [number, number, number, number]
type Mat4 = [Vec4, Vec4, Vec4, Vec4]

const _VOL_DETAIL_MAP: Record<string, { shader: string, opacity: number }> = {
  "PLI Fiber Orientation Red Channel": {
    shader: "void main(){ float x = toNormalized(getDataValue()); if (x < 0.1) { emitTransparent(); } else { emitRGB(vec3(1.0 * x, x * 0., 0. * x )); } }",
    opacity: 1
  },
  "PLI Fiber Orientation Green Channel": {
    shader: "void main(){ float x = toNormalized(getDataValue()); if (x < 0.1) { emitTransparent(); } else { emitRGB(vec3(0. * x, x * 1., 0. * x )); } }",
    opacity: 0.5
  },
  "PLI Fiber Orientation Blue Channel": {
    shader: "void main(){ float x = toNormalized(getDataValue()); if (x < 0.1) { emitTransparent(); } else { emitRGB(vec3(0. * x, x * 0., 1.0 * x )); } }",
    opacity: 0.25
  },
  "Blockface Image": {
    shader: "void main(){ float x = toNormalized(getDataValue()); if (x < 0.1) { emitTransparent(); } else { emitRGB(vec3(0.8 * x, x * 1., 0.8 * x )); } }",
    opacity: 1.0
  },
  "PLI Transmittance": {
    shader: "void main(){ float x = toNormalized(getDataValue()); if (x > 0.9) { emitTransparent(); } else { emitRGB(vec3(x * 1., x * 0.8, x * 0.8 )); } }",
    opacity: 1.0
  },
  "T2w MRI": {
    shader: "void main(){ float x = toNormalized(getDataValue()); if (x < 0.1) { emitTransparent(); } else { emitRGB(vec3(0.8 * x, 0.8 * x, x * 1. )); } }",
    opacity: 1
  },
  "MRI Labels": {
    shader: null,
    opacity: 1
  }
}

@Component({
  selector: 'ng-layer-ctl',
  templateUrl: './ngLayerCtrl.template.html',
  styleUrls: [
    './ngLayerCtrl.style.css'
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class NgLayerCtrlCmp implements OnChanges, OnDestroy{

  private onDestroyCb: (() => void)[] = []
  private removeLayer: () => void

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
  
  transform: Mat4
  @Input('ng-layer-ctl-transform')
  set _transform(xform: string | Mat4) {
    const parsedResult = typeof xform === "string"
      ? JSON.parse(xform)
      : xform
    if (!isMat4(xform)) {
      return
    }
    this.transform = xform as Mat4
  }

  visible: boolean = true
  private viewer: NehubaViewerUnit

  constructor(
    private store: Store<any>,
    @Inject(NEHUBA_INSTANCE_INJTKN) nehubaViewer$: Observable<NehubaViewerUnit>
  ){
    const sub = nehubaViewer$.subscribe(v => this.viewer = v)
    this.onDestroyCb.push(
      () => sub.unsubscribe()
    )
  }

  ngOnDestroy(): void {
    while(this.onDestroyCb.length > 0) this.onDestroyCb.pop()()
    if (this.removeLayer) {
      this.removeLayer()
      this.removeLayer = null
    }
  }

  ngOnChanges(): void {
    if (this.name in _VOL_DETAIL_MAP) {
      const { shader, opacity } = _VOL_DETAIL_MAP[this.name]
      this.shader = shader
      this.opacity = opacity
    }

    if (this.name && this.source) {
      const { name } = this
      if (this.removeLayer) {
        this.removeLayer()
        this.removeLayer = null
      }
      this.store.dispatch(
        ngViewerActionAddNgLayer({
          layer: [{
            name: name,
            shader: this.shader,
            transform: this.transform,
            source: `precomputed://${this.source}`,
            opacity: this.opacity
          }]
        })
      )
      this.removeLayer = () => {
        this.store.dispatch(
          ngViewerActionRemoveNgLayer({
            layer: [{ name }]
          })
        )
      }
    }
  }

  toggleVisibility(){
    this.visible = !this.visible
    this.viewer.nehubaViewer.ngviewer.layerManager.getLayerByName(this.name).setVisible(this.visible)
  }
}
