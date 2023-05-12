import { Directive, Input } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { Release } from "./type"
import { HttpClient } from "@angular/common/http";
import { map, switchMap } from "rxjs/operators";

@Directive({
  selector: 'sxplr-newest-release'
})
export class NewestRelease {

  #ownerRepo = new BehaviorSubject<string>('fzj-inm1-bda/siibra-explorer')
  @Input()
  set ownerRepo(val: string) {
    this.#ownerRepo.next(val)
  }

  
  releases$ = this.#ownerRepo.pipe(
    switchMap(ownerrepo =>
      this.http.get<Release[]>(`https://api.github.com/repos/${ownerrepo}/releases`)
    ),
  )

  newestRelease$ = this.releases$.pipe(
    map(arr => arr[0])
  )

  constructor(private http: HttpClient){}
}
