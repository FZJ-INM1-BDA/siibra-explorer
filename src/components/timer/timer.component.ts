import { Component, EventEmitter, HostBinding, Input, OnDestroy, OnInit, Output } from "@angular/core";
import { timedValues } from "../../util/generator"

@Component({
  selector: 'timer-component',
  templateUrl: './timer.template.html',
  styleUrls: [
    './timer.style.css',
  ],
})

export class TimerComponent implements OnInit, OnDestroy {
  @Input() private timeout: number = 500
  @Input() private pause: boolean = false
  @Output() public timerEnd: EventEmitter<boolean> = new EventEmitter()

  private generator: IterableIterator<any> = null
  public progress: number = 0
  private baseProgress: number = 0

  private rafCbId: number
  private rafCb = () => {
    if (this.pause) {
      this.generator = null
      this.baseProgress = this.progress
    } else {
      if (this.generator === null) {
        this.generator = timedValues(this.timeout * (1 - this.baseProgress), 'linear')
      } else {
        const next = this.generator.next()
        this.progress = this.baseProgress + (1 - this.baseProgress) * next.value
        if (next.done) {
          this.timerEnd.emit(true)
          return
        }
      }
    }
    this.rafCbId = requestAnimationFrame(this.rafCb)
  }

  get transform() {
    return `translateX(${this.progress * 100}%)`
  }

  public ngOnInit() {
    this.rafCbId = requestAnimationFrame(this.rafCb)
  }

  public ngOnDestroy() {
    if (this.rafCbId) { cancelAnimationFrame(this.rafCbId) }
  }
}
