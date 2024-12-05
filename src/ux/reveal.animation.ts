import { Directive, ElementRef, Input } from "@angular/core";
import { animate, AnimationBuilder, AnimationPlayer, style } from "@angular/animations"
import { BehaviorSubject } from "rxjs";

@Directive({
  selector: '[sxplr-reveal]',
  exportAs: "reveal"
})

export class RevealAnimationDirective{
  
  #hostHeight: number|null = null
  #player: AnimationPlayer
  #state = true

  minimizedHeight: string|number = "1rem"

  state$ = new BehaviorSubject(this.#state)
  get state(){
    return this.#state
  }

  @Input("reveal-state")
  set state(value: boolean){
    if (value) {
      this.open()
    } else {
      this.close()
    }
  }

  constructor(private builder: AnimationBuilder, private el: ElementRef){
  }

  #beforeAnimation(){
    if (this.#player) {
      this.#player.destroy()
    }
  }

  open(){
    if (this.#state) {
      return
    }
    this.#state = !this.#state
    this.state$.next(this.#state)
    this.#beforeAnimation()
    const start = this.minimizedHeight
    const end = this.#hostHeight
    this.#hostHeight = null
    
    const factory = this.builder.build([
      ...RevealAnimationDirective.GetSequence(start, end),
      style({ height: "auto" })
    ])
    this.#player = factory.create(this.el.nativeElement)
    this.#player.play()
  }

  close(){
    if (!this.#state) {
      return
    }
    this.#state = !this.#state
    this.state$.next(this.#state)
    this.#beforeAnimation()
    const hostHeight = (this.el.nativeElement as HTMLElement).clientHeight
    this.#hostHeight = hostHeight
    const start = hostHeight
    const end = this.minimizedHeight
    
    const factory = this.builder.build(
      RevealAnimationDirective.GetSequence(start, end)
    )
    this.#player = factory.create(this.el.nativeElement)
    this.#player.play()
  }

  toggle(){
    if (this.#state) {
      this.close()
    } else {
      this.open()
    }

  }

  static GetSequence(starting: number|string, ending: number|string){
    return [
      style({ height: starting }),
      animate("200ms ease-in-out", style({ height: ending }))
    ]
  }
}