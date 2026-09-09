import { CommonModule } from "@angular/common";
import { Component, Input, OnChanges, OnDestroy } from "@angular/core";
import { MatSelectChange } from "@angular/material/select";
import { AngularMaterialModule } from "src/sharedModules";

const GEOMSVC_HOST = "https://geom-svc.apps.ebrains.eu"
const FIBER_LAYER_ID = 'geom-svc-fiber-layer'

@Component({
  selector: 'geomsvc-fiber',
  templateUrl: './fiber.template.html',
  styleUrls: [
    './fiber.style.scss'
  ],
  standalone: true,
  imports: [
    CommonModule,
    AngularMaterialModule,
  ]
})

export class FiberUI implements OnDestroy, OnChanges{
  ids: string[] = []

  lods: string[] = []

  @Input()
  bucketname: string | null = null

  @Input()
  fname: string | null = null

  #layer = null

  async ngOnChanges(){
    if (!this.fname) {
      return
    }
    const fiberBaseUrl = `${GEOMSVC_HOST}/fiber/${this.bucketname}/${encodeURIComponent(this.fname)}`

    const meta = await (await fetch(`${fiberBaseUrl}/stat`)).json()
    this.ids = meta['ids']
    this.lods = meta['lods']
  }

  ngOnDestroy(): void {
    this.cleanupLayer()
  }

  cleanupLayer(){
    if (this.#layer) {
      (window as any).viewer.layerManager.removeManagedLayer(this.#layer)
      this.#layer = null
    }
  }

  selectLod(ev: MatSelectChange){
    if (!this.fname) {
      return
    }
    this.cleanupLayer()
    const bboxmin = `0,0,0`
    const bboxmax = `193,229,193`

    const opt = {
      "type":"segmentation",
      "opacity":1,
      "clType":"customlayer/nglayer",
      "segments":["0","1","2","3","4","5","6","7","8","9","10","11","12","13","14","15","16","17","18","19","20","21","22","23","24","25","26","27","28","29","30","31","32","33","34","35","36","37","38","39","40","41","42","43","44","45","46","47","48","49"],
      "source":`precomputed://${GEOMSVC_HOST}/fiber/${this.bucketname}/${this.fname}/ngskeleton/${encodeURIComponent(ev.value)}/${encodeURIComponent(bboxmin)}/${bboxmax}`
    }
    
    const l = (window as any).viewer.layerSpecification.getLayer(
      FIBER_LAYER_ID,
      opt
    )
    this.#layer = (window as any).viewer.layerManager.addManagedLayer(l)


    setTimeout(() => {
      (window as any).nehubaViewer.setMeshesToLoad(this.ids, {
        name: FIBER_LAYER_ID
      })
    }, 1000)
  }
}
