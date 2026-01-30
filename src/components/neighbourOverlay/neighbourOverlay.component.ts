import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";

type OverlayStyle = 'previousline-end-inset' | 'nextline-start-outset' | null

@Component({
  templateUrl: './neighbourOverlay.template.html',
  selector: 'neighbour-overlay',
  styleUrls: [
    './neighbourOverlay.style.scss'
  ],
  standalone: true,
  imports: [
    CommonModule,
  ],
  host: {
    '[style.transform]': "'translateY(' + ytranslate + ')'",
    '[style.justify-content]': "justifyContent"
  }
})

export class NeighbourOverlay {
  @Input()
  set overlayStyle(st: OverlayStyle) {
    if (st === "previousline-end-inset") {
      this.ytranslate = '-2rem'
      this.justifyContent = 'flex-end'
      this.positionerJustifyContent = 'flex-end'
      return
    }
    if (st === "nextline-start-outset") {
      this.ytranslate = "2rem"
      this.justifyContent = 'flex-end'
      this.positionerJustifyContent = 'flex-start'
      return
    }
  }

  ytranslate = '0%'
  justifyContent = null
  positionerJustifyContent = null
}
