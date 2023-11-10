import { ChangeDetectionStrategy, Component } from "@angular/core"
import { PureATPSelectorDirective } from "../pureATP.directive"

@Component({
  selector: 'sxplr-pure-atp-selector',
  templateUrl: `./pureATPSelector.template.html`,
  styleUrls: [
    `./pureATPSelector.style.scss`
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class PureATPSelector extends PureATPSelectorDirective{}
