import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from "@angular/core";

@Component({
  selector: 'radio-list',
  templateUrl: './radiolist.template.html',
  styleUrls: [
    './radiolist.style.css',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class RadioList {
  @Input()
  public listDisplay: (item: any) => string = (obj) => obj.name

  @Output()
  public itemSelected: EventEmitter<any> = new EventEmitter()

  @Input()
  public selectedItem: any | null = null

  @Input()
  public inputArray: IHasExtraButtons[] = []

  @Input()
  public ulClass: string = ''

  @Input() public checkSelected: (selectedItem: any, item: any) => boolean = (si, i) => si === i

  @Output() public extraBtnClicked = new EventEmitter<IExraBtnClickEvent>()

  public handleExtraBtnClick(extraBtn: IExtraButton, inputItem: any, event: MouseEvent) {
    this.extraBtnClicked.emit({
      extraBtn,
      inputItem,
      event,
    })
  }

  public overflowText(event) {
    return (event.offsetWidth < event.scrollWidth)
  }
}

export interface IExtraButton {
  name: string
  faIcon: string
  class?: string
}

export interface IHasExtraButtons {
  extraButtons?: IExtraButton[]
}

export interface IExraBtnClickEvent {
  extraBtn: IExtraButton
  inputItem: any
  event: MouseEvent
}
