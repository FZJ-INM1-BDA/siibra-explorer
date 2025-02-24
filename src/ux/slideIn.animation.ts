import { animate, AnimationAnimateMetadata, AnimationBuilder, AnimationPlayer, AnimationStyleMetadata, style } from "@angular/animations";
import { Directive, ElementRef, EventEmitter, inject, Input, Output } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { debounceTime, distinctUntilChanged, skip, take, takeUntil } from "rxjs/operators";
import { DestroyDirective } from "src/util/directives/destroy.directive";

type Direction = "top" | "left"

const stateDict: Record<
  Direction, Record<
    "open"|"close", (skipAnimation: boolean) => ((AnimationAnimateMetadata | AnimationStyleMetadata)[])
  >
> = {
  "top": {
    open: (skipAnimation:boolean = false) => {
      const finalFrame = style({ transform: `translateY(0%)`})
      const sequences = [
        style({ transform: `translateY(-100%)` }),
        animate(`200ms ease-out`, style({ transform: `translateY(0%)` })),
      ]
      return skipAnimation
      ? [finalFrame]
      : [...sequences, finalFrame]
    },
    close: (skipAnimation:boolean = false) => {
      const finalFrame = style({ transform: `translateY(-100%)` })
      const sequences = [
        style({ transform: `translateY(0%)` }),
        animate(`200ms ease-in`, style({ transform: `translateY(-100%)` })),
      ]
      return skipAnimation
      ? [finalFrame]
      : [...sequences, finalFrame]
    }
  },
  "left": {
    open: (skipAnimation:boolean = false) => {
      const finalFrame = style({ transform: `translateX(0%)`})
      const sequences = [
        style({ transform: `translateX(-100%)` }),
        animate(`200ms ease-out`, style({ transform: `translateX(0%)` })),
      ]
      return skipAnimation
      ? [finalFrame]
      : [...sequences, finalFrame]
    },
    close: (skipAnimation:boolean = false) => {
      const finalFrame = style({ transform: `translateX(-100%)` })
      const sequences = [
        style({ transform: `translateX(0%)` }),
        animate(`200ms ease-in`, style({ transform: `translateX(-100%)` })),
      ]
      return skipAnimation
      ? [finalFrame]
      : [...sequences, finalFrame]
    }
  }
}

@Directive({
  selector: '[sxplr-slide-in]',
  exportAs: 'slideIn',
  hostDirectives: [
    DestroyDirective,
  ]
})

export class SlideInAnimation {

  #ondestroy$ = inject(DestroyDirective).destroyed$

  #player: AnimationPlayer
  
  #state = false
  state$ = new BehaviorSubject<boolean>(this.#state)
  get state(){
    return this.#state
  }
  @Input('state')
  set state(val) {
    this.state$.next(val)
  }
  
  @Input()
  direction: Direction = "top"

  @Output()
  animationBegins = new EventEmitter()
  
  @Output()
  animationEnds = new EventEmitter()

  constructor(private builder: AnimationBuilder, private el: ElementRef){
    const state$ = this.state$.pipe(
      takeUntil(this.#ondestroy$),
      debounceTime(16),
      distinctUntilChanged()
    )

    state$.pipe(
      take(1)
    ).subscribe(state => {
      if (state) {
        this.open(true)
      } else {
        this.close(true)
      }
    })

    state$.pipe(
      skip(1)
    ).subscribe(state => {
      
      if (state) {
        this.open()
      } else {
        this.close()
      }
    })

  }

  #beforeAnimation(){
    if (this.#player) {
      this.#player.destroy()
    }
    this.animationBegins.emit()
  }

  open(skipAnimation: boolean=false){
    this.#beforeAnimation()

    const { open } = stateDict[this.direction]

    const factory = this.builder.build(open(skipAnimation))
    this.#player = factory.create(this.el.nativeElement)
    this.#player.play()
    this.#player.onDone(() => this.animationEnds.emit())
  }
  close(skipAnimation: boolean=false){
    this.#beforeAnimation()

    const { close } = stateDict[this.direction]

    const factory = this.builder.build(close(skipAnimation))
    this.#player = factory.create(this.el.nativeElement)
    this.#player.play()
    this.#player.onDone(() => this.animationEnds.emit())
  }

}