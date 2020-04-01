import { Component, Input, OnChanges, ChangeDetectionStrategy } from "@angular/core";
import { NgLayersService } from "../ngLayerService.service";
import { MatSliderChange } from "@angular/material/slider";
import { MatSlideToggleChange } from "@angular/material/slide-toggle";

@Component({
  selector: 'layer-detail-cmp',
  templateUrl: './layerDetail.template.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class LayerDetailComponent implements OnChanges{
  @Input() 
  layerName: string

  @Input()
  ngViewerInstance: any

  constructor(private layersService: NgLayersService){

  }

  ngOnChanges(){
    if (!this.layerName) return
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
    if (!this.viewer) throw new Error(`viewer is not defined`)
    const layer = this.viewer.layerManager.getLayerByName(this.layerName)
    if (!layer) throw new Error(`layer with name: ${this.layerName}, not found.`)
    if (! (layer.layer?.fragmentMain?.restoreState) ) throw new Error(`layer.fragmentMain is not defined... is this an image layer?`)
    const shader = this.layersService.getShader(
      this.lowThreshold,
      this.highThreshold,
      this.brightness,
      this.contrast,
      this.removeBg
    )
    layer.layer.fragmentMain.restoreState(shader)
  }

  get viewer(){
    return this.ngViewerInstance || (window as any).viewer
  }
}
