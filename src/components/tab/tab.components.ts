import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output } from "@angular/core";
import { AngularMaterialModule } from "src/sharedModules";

@Component({
  selector: 'sxplr-tab',
  standalone: true,
  imports: [
    CommonModule,
    AngularMaterialModule,
  ],
  templateUrl: "./tab.template.html",
  styleUrls: [
    "./tab.style.scss"
  ]
})

export class TabComponent{
  @Input("sxplr-tab-icon")
  icon: string = "fas fa-file"
  
  // see https://fonts.google.com/icons?icon.set=Material+Icons
  @Input("sxplr-tab-mat-icon")
  mat_icon: string

  @Input("sxplr-tab-badge")
  badge: number
  
  @Input("sxplr-tab-badge-color")
  badgeColor: "primary" | "warn" = "primary"

  @Input("sxplr-tab-color")
  color: "primary" | "warn" | "danger"

  @Input("sxplr-tab-override-color")
  overrideColor: string

  @Input('sxplr-tab-override-class')
  overrideCls: string

  @Output('sxplr-tab-click')
  click = new EventEmitter<MouseEvent>()
}
