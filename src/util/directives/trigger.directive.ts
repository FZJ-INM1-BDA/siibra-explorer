import { Directive, EventEmitter, OnInit, Output } from "@angular/core";

@Directive({
  selector: '[sxplr-triggers]',
  standalone: true
})

export class SxplrTriggers implements OnInit{
  @Output('init')
  init = new EventEmitter()

  ngOnInit(): void {
    this.init.emit(null)
  }
}
