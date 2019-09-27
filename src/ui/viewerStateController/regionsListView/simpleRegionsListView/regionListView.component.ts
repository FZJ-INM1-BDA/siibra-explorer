import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from "@angular/core";

@Component({
  selector: 'regions-list-view',
  templateUrl: './regionListView.template.html',
  styleUrls: [
    './regionListView.style.css'
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class RegionsListView{
  @Input() horizontal: boolean = false

  @Input() regionsSelected: any[] = []
  @Output() deselectRegion: EventEmitter<any> = new EventEmitter()
  @Output() gotoRegion: EventEmitter<any> = new EventEmitter()
}