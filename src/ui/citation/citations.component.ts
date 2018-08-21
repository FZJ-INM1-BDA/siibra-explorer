import { Component, Input } from "@angular/core";
import { Property } from "../../services/stateStore.service";


@Component({
  selector : 'citations',
  templateUrl : './citations.template.html',
  styleUrls : [
    './citations.style.css'
  ]
})

export class CitationsContainer{
  @Input() properties : Property
}