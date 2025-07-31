import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, Inject, Optional } from "@angular/core";
import { AngularMaterialModule } from "src/sharedModules";
import { OVELAY_DATA, SxplrOverlayCfg } from "./overlay.service";

@Component({
  selector: 'sxplr-overlay',
  templateUrl: './overlay.template.html',
  styleUrls: [
    './overlay.style.scss'
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    AngularMaterialModule,
  ]
})

export class SxplrOverlay {
  constructor(
    @Optional()
    @Inject(OVELAY_DATA)
    public data: SxplrOverlayCfg
  ){

  }
}
