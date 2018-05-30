import { Injectable } from "@angular/core";


@Injectable({
  providedIn : 'root'
})

export class NehubaDataService{
  public counter : number = 0

  constructor(){
    /* fetch init services here */
  }

  public increment(){
    this.counter ++
  }

  public decrement(){
    this.counter --
  }

}