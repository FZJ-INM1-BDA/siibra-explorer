import { animate, AnimationBuilder, AnimationPlayer, style } from "@angular/animations";
import { Directive, ElementRef, inject, Input } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { debounceTime, distinctUntilChanged, takeUntil } from "rxjs/operators";
import { DestroyDirective } from "src/util/directives/destroy.directive";

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
  state$ = new BehaviorSubject(this.#state)
  get state(){
    return this.#state
  }
  @Input('state')
  set state(val) {
    this.state$.next(val)
  }

  constructor(private builder: AnimationBuilder, private el: ElementRef){
    this.state$.pipe(
      takeUntil(this.#ondestroy$),
      debounceTime(16),
      distinctUntilChanged(),
    ).subscribe(state => {
      this.#state = state
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
  }

  open(){
    this.#beforeAnimation()

    const sequences = [
      style({ transform: `translateX(-100%)` }),
      animate(`200ms ease-out`, style({ transform: `translateX(0%)` })),
      style({ transform: `translateX(0%)`}),
    ]
    const factory = this.builder.build(sequences)
    this.#player = factory.create(this.el.nativeElement)
    this.#player.play()
  }
  close(){
    this.#beforeAnimation()

    const sequences = [
      style({ transform: `translateX(0%)` }),
      animate(`200ms ease-in`, style({ transform: `translateX(-100%)` })),
      style({ transform: `translateX(-100%)` }),
    ]
    const factory = this.builder.build(sequences)
    this.#player = factory.create(this.el.nativeElement)
    this.#player.play()
  }

}