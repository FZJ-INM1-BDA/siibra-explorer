import { ChangeDetectionStrategy, Component, Input } from "@angular/core";
import { FallbackIcon, Icon, MaterialIcon } from "src/util/types";
import { AngularMaterialModule } from "../angularMaterial.module";
import { CommonModule } from "@angular/common";
import { BehaviorSubject } from "rxjs";
import { map } from "rxjs/operators";

function isMaterialIcon(icon: Icon): icon is MaterialIcon {
  return !!icon["materialIcon"]
}

function isFallbackIcon(icon: Icon): icon is FallbackIcon {
  return !!icon["set"] && !!icon["icon"]
}

@Component({
  selector: 'sxplr-icon',
  templateUrl: './icon.template.html',
  styleUrls: [
    "./icon.style.scss"
  ],
  standalone: true,
  imports: [
    AngularMaterialModule,
    CommonModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IconComponent {

  #icon = new BehaviorSubject(null)
  @Input('icon')
  set _icon(icon: any){
    this.#icon.next(icon)
  }

  icon$ = this.#icon.pipe(
    map(icon => {
      return {
        materialIcon: isMaterialIcon(icon) && icon,
        fallbackIcon: isFallbackIcon(icon) && icon,
      }
    })
  )
}
