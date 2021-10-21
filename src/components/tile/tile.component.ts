import { Component, EventEmitter, HostBinding, HostListener, Input, OnChanges, Output } from "@angular/core";

@Component({
  selector: 'tile-cmp',
  templateUrl: './tile.template.html',
  styleUrls: [
    './tile.style.css'
  ]
})

export class TileCmp implements OnChanges{
  @Input('tile-image-src')
  tileImgSrc: string

  @Input('tile-image-alt')
  tileImgAlt: string = 'Thumbnail of this tile.'

  @Input('tile-text')
  tileText: string = 'Tile'

  @Input('tile-show-info')
  tileShowInfo: boolean = false

  @Input('tile-disabled')
  tileDisabled: boolean = false

  @Input('tile-image-darktheme')
  darktheme: boolean = false

  @Input('tile-selected')
  selected: boolean = false

  @Output('tile-on-click')
  onClick: EventEmitter<MouseEvent> = new EventEmitter()

  @Input('tile-is-dir')
  isDir: boolean = false

  @Output('tile-on-info-click')
  onInfoClick: EventEmitter<MouseEvent> = new EventEmitter()

  @HostBinding('class')
  hostBindingClass = ''

  @HostListener('click', ['$event'])
  protected _onClick(event: MouseEvent) {
    this.onClick.emit(event)
  }

  ngOnChanges(){
    if (this.tileDisabled) this.hostBindingClass = 'muted'
    else this.hostBindingClass = ''
  }
}
