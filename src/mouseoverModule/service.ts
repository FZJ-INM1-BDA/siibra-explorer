import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { debounceTime, shareReplay } from "rxjs/operators";
import { THoverConfig } from "src/util/injectionTokens";

@Injectable({
  providedIn: 'root'
})
export class MouseOverSvc {

  #messages: THoverConfig[] = []

  #messages$ = new BehaviorSubject(this.#messages)
  messages$ = this.#messages$.pipe(
    debounceTime(16),
    shareReplay(1),
  )

  set messages(messages: THoverConfig[]){
    this.#messages = messages
    this.#messages$.next(this.#messages)
  }

  get messages(): THoverConfig[]{
    return this.#messages
  }

  append(message: THoverConfig){
    this.messages = this.messages.concat(message)
  }
  remove(message: THoverConfig){
    this.messages = this.messages.filter(v => v !== message)
  }
}
