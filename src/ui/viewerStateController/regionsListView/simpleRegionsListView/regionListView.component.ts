import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from "@angular/core";

@Component({
  selector: 'regions-list-view',
  templateUrl: './regionListView.template.html',
  styleUrls: [
    './regionListView.style.css',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class RegionsListView {
  @Input() public horizontal: boolean = false

  @Input() public regionsSelected: any[] = []
  @Output() public deselectRegion: EventEmitter<any> = new EventEmitter()
  @Output() public gotoRegion: EventEmitter<any> = new EventEmitter()
}
