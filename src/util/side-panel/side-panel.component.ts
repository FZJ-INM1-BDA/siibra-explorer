import { Component, Input } from '@angular/core';

@Component({
  selector: 'sxplr-side-panel',
  templateUrl: './side-panel.component.html',
  styleUrls: ['./side-panel.component.scss']
})
export class SidePanelComponent {
  @Input('sxplr-side-panel-card-color')
  cardColor: string = `rgb(200, 200, 200)`

  @Input('sxplr-side-panel-card-color')
  darktheme: boolean = false
}
