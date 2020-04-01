import { Component, Input } from "@angular/core";
import { IProperty } from "../../services/stateStore.service";

@Component({
  selector : 'citations-component',
  templateUrl : './citations.template.html',
  styleUrls : [
    './citations.style.css',
  ],
})

export class CitationsContainer {
  @Input() public properties: IProperty
}
