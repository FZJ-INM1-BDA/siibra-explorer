import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, Input, NgZone, OnChanges } from '@angular/core';

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

  plotlyRef: any
  
  constructor(private el: ElementRef, private zone: NgZone) { }

  ngOnChanges(): void {
    if (!this.plotlyJson) return
    const rootEl = (this.el.nativeElement as HTMLElement).querySelector(".plotly-root")
    const { data, layout } = this.plotlyJson
    this.plotlyRef = window['Plotly'].newPlot(rootEl, data, layout, { responsive: true })
  }

}
