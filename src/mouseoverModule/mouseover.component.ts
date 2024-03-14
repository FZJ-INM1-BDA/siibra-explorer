import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { AngularMaterialModule } from "src/sharedModules";
import { MouseOverSvc } from "./service";

@Component({
  selector: 'mouseover-info',
  templateUrl: './mouseover.template.html',
  styleUrls: [
    './mouseover.style.css'
  ],
  standalone: true,
  imports: [
    AngularMaterialModule,
    CommonModule
  ],
})

export class MouseOver {
  constructor(private svc: MouseOverSvc) {}
  messages$ = this.svc.messages$
}
