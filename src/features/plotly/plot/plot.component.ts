import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, OnChanges, Output } from '@angular/core';

type PlotlyEvent = "plotly_click"

type PlotlyPoint = {
  label: string
}

type PlotlyEv = {
  event: MouseEvent
  points: PlotlyPoint[]
}


type PlotlyElement = {
  on: (eventName: PlotlyEvent, callback: (ev: PlotlyEv) => void) => void
}

@Component({
  selector: 'sxplr-plotly-component',
  templateUrl: './plot.component.html',
  styleUrls: ['./plot.component.scss'],
  standalone: true,
  imports: [
    CommonModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlotComponent implements OnChanges {

  @Input("plotly-json")
  plotlyJson: any

  @Output("plotly-label-clicked")
  labelClicked = new EventEmitter<string>()

  bindOnClick(el: PlotlyElement) {
    el.on("plotly_click", ev => {
      const { points } = ev
      for (const pt of points){
        this.labelClicked.emit(pt.label)
      }
    })
  }

  plotlyRef: any
  
  constructor(private el: ElementRef) { }

  ngOnChanges(): void {
    if (!this.plotlyJson) return
    const rootEl = (this.el.nativeElement as HTMLElement).querySelector(".plotly-root")
    const { data, layout } = this.plotlyJson
    this.plotlyRef = window['Plotly'].newPlot(rootEl, data, layout, { responsive: true });

    this.bindOnClick(rootEl as any)
  }

}
