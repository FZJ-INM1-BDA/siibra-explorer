import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, HostBinding, HostListener, Input, NgZone, OnInit, Output, ViewChild, ViewContainerRef } from "@angular/core";
import { toastAnimation } from "./toast.animation";

@Component({
  selector : 'toast',
  templateUrl : './toast.template.html',
  styleUrls : ['./toast.style.css'],
  animations : [
    toastAnimation,
  ],
})

export class ToastComponent {
  @Input() public message: string
  @Input() public htmlMessage: string
  @Input() public timeout: number = 0
  @Input() public dismissable: boolean = true

  @Output() public dismissed: EventEmitter<boolean> = new EventEmitter()

  public progress: number = 0
  public hover: boolean

  @HostBinding('@exists')
  public exists: boolean = true

  @ViewChild('messageContainer', {read: ViewContainerRef}) public messageContainer: ViewContainerRef

  public dismiss(event: MouseEvent) {
    event.preventDefault()
    event.stopPropagation()

    this.dismissed.emit(true)
  }
}
