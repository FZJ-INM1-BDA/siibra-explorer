import { Component, EventEmitter, Input, Output } from "@angular/core";

@Component({
  selector: 'pill-component',
  templateUrl: './pill.template.html',
  styleUrls: [
    './pill.style.css',
  ],
})

export class PillComponent {
  @Input() public title: string = 'Untitled Pill'
  @Input() public showClose: boolean = true
  @Output() public pillClicked: EventEmitter<boolean> = new EventEmitter()
  @Output() public closeClicked: EventEmitter<boolean> = new EventEmitter()

  @Input() public containerStyle: any = {
    backgroundColor: 'grey',
  }
  @Input() public closeBtnStyle: any = {
    backgroundColor: 'lightgrey',
  }

  public close() {
    this.closeClicked.emit(true)
  }
}
