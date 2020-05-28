import { Component, Input, OnChanges, ChangeDetectionStrategy, Optional, Inject } from "@angular/core";
import { NgLayersService } from "../ngLayerService.service";
import { MatSliderChange } from "@angular/material/slider";
import { MatSlideToggleChange } from "@angular/material/slide-toggle";
import { COLORMAP_IS_JET, getShader, PMAP_DEFAULT_CONFIG } from "src/util/constants";

export const VIEWER_INJECTION_TOKEN = `VIEWER_INJECTION_TOKEN`

@Component({
  selector: 'layer-detail-cmp',
  templateUrl: './layerDetail.template.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class LayerDetailComponent implements OnChanges{
  @Input() 
  layerName: string

  private colormap = null 

  constructor(
    private layersService: NgLayersService,
    @Optional() @Inject(VIEWER_INJECTION_TOKEN) private injectedViewer
  ){

  }

  ngOnChanges(){
    if (!this.layerName) return

    const isPmap = (this.fragmentMain.value as string).includes(COLORMAP_IS_JET)
    const { colormap, lowThreshold, removeBg } = PMAP_DEFAULT_CONFIG
    if (isPmap) {
      this.colormap = colormap
      this.lowThreshold = lowThreshold
      this.removeBg = removeBg
    }

    this.lowThreshold = this.layersService.lowThresholdMap.get(this.layerName) || this.lowThreshold
    this.highThreshold = this.layersService.highThresholdMap.get(this.layerName) || this.highThreshold
    this.brightness = this.layersService.brightnessMap.get(this.layerName) || this.brightness
    this.contrast = this.layersService.contrastMap.get(this.layerName) || this.contrast
    this.removeBg = this.layersService.removeBgMap.get(this.layerName) || this.removeBg
  }

  public lowThreshold: number = 0
  public highThreshold: number = 1
  public brightness: number = 0
  public contrast: number = 0
  public removeBg: boolean = false

  handleChange(mode: 'low' | 'high' | 'brightness' | 'contrast', event: MatSliderChange){
    switch(mode) {
    case 'low':
      this.layersService.lowThresholdMap.set(this.layerName, event.value)
      this.lowThreshold = event.value
      break;
    case 'high':
      this.layersService.highThresholdMap.set(this.layerName, event.value)
      this.highThreshold = event.value
      break;
    case 'brightness':
      this.layersService.brightnessMap.set(this.layerName, event.value)
      this.brightness = event.value
      break;
    case 'contrast':
      this.layersService.contrastMap.set(this.layerName, event.value)
      this.contrast = event.value
      break;
    default: return
    }
    this.triggerChange()
  }

  handleToggleBg(event: MatSlideToggleChange){
    this.layersService.removeBgMap.set(this.layerName, event.checked)
    this.removeBg = event.checked
    this.triggerChange()
  }

  triggerChange(){
    const { lowThreshold, highThreshold, brightness, contrast, removeBg, colormap } = this
    const shader = getShader({
      lowThreshold,
      highThreshold, 
      colormap,
      brightness,
      contrast,
      removeBg
    })
    this.fragmentMain.restoreState(shader)
  }

  private get viewer(){
    return this.injectedViewer || (window as any).viewer
  }

  private get fragmentMain(){

    if (!this.viewer) throw new Error(`viewer is not defined`)
    const layer = this.viewer.layerManager.getLayerByName(this.layerName)
    if (!layer) throw new Error(`layer with name: ${this.layerName}, not found.`)
    if (! (layer.layer?.fragmentMain?.restoreState) ) throw new Error(`layer.fragmentMain is not defined... is this an image layer?`)

    return layer.layer.fragmentMain
  }
}
