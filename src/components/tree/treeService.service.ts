import { Injectable } from "@angular/core";
import { Subject } from "rxjs";

@Injectable()
export class TreeService {
  public mouseclick: Subject<any> = new Subject()
  public mouseenter: Subject<any> = new Subject()
  public mouseleave: Subject<any> = new Subject()

  public findChildren: (item: any) => any[] = (item) => item.children
  public searchFilter: (item: any) => boolean | null = () => true
  public renderNode: (item: any) => string = (item) => item.name

  public searchTerm: string = ``

  public markForCheck: Subject<any> = new Subject()
}
