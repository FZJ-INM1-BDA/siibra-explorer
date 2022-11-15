import { Input, Directive, ElementRef, Renderer2, OnChanges, SimpleChanges } from "@angular/core";

@Directive({
  selector: '[sxplr-ui-config-perspective-view-slider]'
})
export class PerspectiveViewSliderDirective implements OnChanges {

    @Input('sxplr-ui-config-perspective-view-slider-is-highlight') isHighlight = false
    @Input('sxplr-ui-config-perspective-view-slider-maximised-panel-index') maximisedPanelIndex: number
    @Input('sxplr-ui-config-perspective-view-slider-templatetransform') templateTransform: any
    @Input('sxplr-ui-config-perspective-view-slider-nav-pos-voxel') navPosVoxel: any
    @Input('sxplr-ui-config-perspective-view-slider-height') height: any
    @Input('sxplr-ui-config-perspective-view-slider-top') top: any
    @Input('sxplr-ui-config-perspective-view-slider-top-for-sagittal') topForSagittal: any

    constructor(private el: ElementRef, private renderer: Renderer2){}

    ngOnChanges(): void {
      if (this.isHighlight) {
        this.renderer.setStyle(this.el.nativeElement, 'transform', this.maximisedPanelIndex === 2 ? 'rotate(270deg)' : '')
        this.renderer.setStyle(this.el.nativeElement, 'left', this.maximisedPanelIndex === 2 ? `${this.topForSagittal - this.top}px` : 0)
        this.renderer.setStyle(this.el.nativeElement, 'height', `${this.height}px`)
        this.renderer.setStyle(this.el.nativeElement, 'top', `${this[this.maximisedPanelIndex !== 2 ? 'top' : 'topForSagittal']}px`)
      }
      this.renderer.setAttribute(this.el.nativeElement, 'min', this.templateTransform[this.maximisedPanelIndex === 0 ? 1 : this.maximisedPanelIndex === 1 ? 0 : 2])
      this.renderer.setAttribute(this.el.nativeElement, 'max', (-this.templateTransform[this.maximisedPanelIndex === 0 ? 1 : this.maximisedPanelIndex === 1 ? 0 : 2]).toString())
      this.renderer.setStyle(this.el.nativeElement, 'transform', this.maximisedPanelIndex === 2 ? 'rotate(270deg)' : '')
      this.renderer.setProperty(this.el.nativeElement, 'value', (this.navPosVoxel[this.maximisedPanelIndex === 0 ? 1 : this.maximisedPanelIndex === 1 ? 0 : 2] * (this.maximisedPanelIndex === 1 ? -1 : 1)).toString())

    }


}