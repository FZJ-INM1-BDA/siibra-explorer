import { Injectable } from "@angular/core";
import { Subject } from "rxjs";

@Injectable()
export class TreeService{
  mouseclick : Subject<any> = new Subject()
  mouseenter : Subject<any> = new Subject()
  mouseleave : Subject<any> = new Subject()

  findChildren : (item:any)=>any[] = (item)=>item.children
  searchFilter : (item:any)=>boolean | null = ()=>true
  renderNode : (item:any)=>string = (item)=>item.name

  searchTerm : string = ``

  markForCheck : Subject<any> = new Subject()
}