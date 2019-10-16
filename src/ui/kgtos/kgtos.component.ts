import { Component } from "@angular/core";
import { DatabrowserService } from "../databrowserModule/databrowser.service";
import { Observable } from "rxjs";

@Component({
  selector: 'kgtos-component',
  templateUrl: './kgtos.template.html',
  styleUrls: [
    './kgtos.style.css'
  ]
})

export class KGToS{

  public kgTos$: Observable<string>

  constructor(
    private dbService: DatabrowserService
  ){
    this.kgTos$ = this.dbService.kgTos$
  }
}