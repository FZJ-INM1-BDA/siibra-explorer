import { ComponentPortal, CdkPortalOutlet } from "@angular/cdk/portal";
import { CommonModule } from "@angular/common";
import { Component, Inject, Optional } from "@angular/core";
import { AngularMaterialModule } from "src/sharedModules";
import { RM_TOOLBAR_WIDGET } from "./consts";
import { BehaviorSubject } from "rxjs";

@Component({
  templateUrl: './toolbarWidget.template.html',
  styleUrls: [
    './toolbarWidget.style.scss'
  ],
  imports: [
    CdkPortalOutlet,
    CommonModule,
    AngularMaterialModule,
  ],
  standalone: true
})

export class ToolbarWidget<T> {

  name$ = new BehaviorSubject<string|null>(null)
  set name(val: string){
    this.name$.next(val)
  }

  portal: ComponentPortal<T>|undefined

  constructor(@Optional() @Inject(RM_TOOLBAR_WIDGET) public exit: (_this: ToolbarWidget<T>) => void){
  }
}