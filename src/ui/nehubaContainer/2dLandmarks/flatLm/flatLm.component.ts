import { ChangeDetectionStrategy, ChangeDetectorRef, Component, HostBinding, OnChanges, SimpleChanges } from "@angular/core";
import { LandmarkUnitBase } from "../landmark.base";

@Component({
  selector: 'landmark-2d-flat-cmp',
  templateUrl: './flatLm.template.html',
  styleUrls: [
    './flatLm.style.css'
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class FlatLMCmp extends LandmarkUnitBase implements OnChanges{

  @HostBinding('style.transform')
  transform = `translate(0px, 0px)`

  @HostBinding('style.opacity')
  opacity = 1.0

  @HostBinding('style.text-shadow')
  textShadow = null

  private scale: number = 1

  constructor(private cdr: ChangeDetectorRef){
    super()
    this.cdr.detach()
  }

  ngOnChanges(){
    
    const zModifier = Math.tanh(this.positionZ/10)
    if (this.positionZ >= 0) {
      const shadowLength =  zModifier * 4
      this.textShadow = `0 ${shadowLength}px ${shadowLength}px black`
      this.opacity = 1.0
    } else {
      this.textShadow = null
      /**
       * assert(zModifier < 0)
       */
      this.opacity = 1.0 + (zModifier * 0.8)
    }

    this.transform = `translate(${this.positionX}px, ${this.positionY - (zModifier >= 0 ? zModifier * 4 : 0) }px)`
  }
}

export const NORMAL_COLOR: number[] = [201,54,38]
