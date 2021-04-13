import { Component, HostBinding, Input, OnChanges } from "@angular/core";

@Component({
  selector: 'quick-tour-arrow',
  templateUrl: './arrow.template.html',
  styleUrls: [
    './arrow.style.css'
  ]
})

export class ArrowComponent implements OnChanges{

  @HostBinding('style.transform')
  transform = `translate(0px, 0px)`

  stemStyle = {}

  headTranslate = 'translate(0px, 0px)'

  headStyle = {
    transform: `rotate(0deg)`
  }

  @Input('quick-tour-arrow-from')
  fromPos: [number, number]

  @Input('quick-tour-arrow-to')
  toPos: [number, number]

  @Input('quick-tour-arrow-type')
  type: 'straight' | 'concave-from-top' | 'concave-from-bottom' = 'straight'

  ngOnChanges(){
    let rotate: string
    switch(this.type) {
    case 'concave-from-top': {
      rotate = '0deg'
      break
    }
    case 'concave-from-bottom': {
      rotate = '180deg'
      break
    }
    default: {
      rotate = `${(Math.PI / 2) + Math.atan2(
        (this.toPos[1] - this.fromPos[1]),
        (this.toPos[0] - this.fromPos[0])
      )}rad`
    }
    }

    this.transform = `translate(${this.fromPos[0]}px, ${this.fromPos[1]}px)`

    this.headTranslate = `
      translateX(-1.2rem)
      translate(${this.toPos[0] - this.fromPos[0]}px, ${this.toPos[1] - this.fromPos[1]}px)
      rotate(${rotate})
    `
    const x = (this.toPos[0] - this.fromPos[0]) / 100
    const y = (this.toPos[1] - this.fromPos[1]) / 100

    this.stemStyle = {
      transform: `scale(${x}, ${y})`
    }
  }
}
