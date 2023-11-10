import { ChangeDetectionStrategy, Component } from "@angular/core";
import { PureATPSelectorDirective } from "../pureATP.directive";
import { take } from "rxjs/operators";

@Component({
  selector: "sxplr-pure-atp-dropdown",
  templateUrl: './pureATPDropDown.template.html',
  styleUrls: [
    "./pureATPDropDown.style.css"
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class PureATPDropdown extends PureATPSelectorDirective {

  selectAtlas(id: string) {
    const { allAtlases } = this
    const atlas = allAtlases.find(atlas => atlas.id === id)
    if (atlas) {
      this.selectLeaf({ atlas })
    }
  }

  async selectTemplate(id: string) {
    const { availableTemplates } = await this.view$.pipe(
      take(1)
    ).toPromise()
    const template = availableTemplates.find(tmpl => tmpl.id === id)
    if (template) {
      this.selectLeaf({ template })
    }
  }
  async selectParcellation(id: string) {
    const { parcellations } = await this.view$.pipe(
      take(1)
    ).toPromise()
    const parcellation = parcellations.find(p => p.id === id)
    if (parcellation) {
      this.selectLeaf({ parcellation })
    }
  }
}
