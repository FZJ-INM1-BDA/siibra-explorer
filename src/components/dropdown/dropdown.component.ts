import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, HostListener, Input, Output, ViewChild } from "@angular/core";
import { IExraBtnClickEvent, IExtraButton, IHasExtraButtons } from '../radiolist/radiolist.component'
import { dropdownAnimation } from "./dropdown.animation";

@Component({
  selector : 'dropdown-component',
  templateUrl : './dropdown.template.html',
  styleUrls : [
    `./dropdown.style.css`,
  ],
  animations: [
    dropdownAnimation,
  ],
  changeDetection : ChangeDetectionStrategy.OnPush,
})

export class DropdownComponent {

  @Input() public activeDisplayBtns: IExtraButton[] = []
  @Output() public activeDisplayBtnClicked: EventEmitter<{extraBtn: IExtraButton, event: MouseEvent}> = new EventEmitter()

  @Input() public inputArray: IHasExtraButtons[] = []
  @Input() public selectedItem: any | null = null
  @Input() public checkSelected: (selectedItem: any, item: any) => boolean = (si, i) => si === i

  @Input() public listDisplay: (obj: any) => string = (obj) => obj.name
  @Input() public activeDisplay: (obj: any|null) => string = (obj) => obj ? obj.name : `Please select an item.`

  @Output() public itemSelected: EventEmitter<any> = new EventEmitter()
  @Output() public extraBtnClicked: EventEmitter<IExraBtnClickEvent> = new EventEmitter()

  @ViewChild('dropdownToggle', {read: ElementRef}) public dropdownToggle: ElementRef

  public openState: boolean = false

  @HostListener('document:click', ['$event'])
  public close(event: MouseEvent) {
    const contains = this.dropdownToggle.nativeElement.contains(event.target)
    if (contains) {
      this.openState = !this.openState
    } else {
      this.openState = false;
    }
  }

  public handleActiveDisplayBtnClick(btn: IExtraButton, event: MouseEvent) {
    this.activeDisplayBtnClicked.emit({
      extraBtn: btn,
      event,
    })
  }
}
