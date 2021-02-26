import { ChangeDetectionStrategy, Component, ElementRef, Inject, Input, OnChanges, Optional } from "@angular/core";
import { Observable } from "rxjs";
import { BS_DARKTHEME } from "../../constants";
import { BsFeatureReceptorBase } from "../base";
import { CONST } from 'common/constants'

const { RECEPTOR_PR_CAPTION } = CONST

@Component({
  selector: 'bs-features-receptor-profile',
  templateUrl: './profile.template.html',
  styleUrls: [
    './profile.style.css'
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class BsFeatureReceptorProfile extends BsFeatureReceptorBase implements OnChanges{
  
  public RECEPTOR_PR_CAPTION = RECEPTOR_PR_CAPTION

  @Input()
  bsLabel: string

  constructor(
    private elRef: ElementRef,
    @Optional() @Inject(BS_DARKTHEME) public darktheme$: Observable<boolean>,
  ){
    super()
  }

  ngOnChanges(){
    this.error = null
    this.urls = []

    if (!this.bsFeature) {
      this.error = `bsFeature not populated`
      return
    }
    if (!this.bsLabel) {
      this.error = `bsLabel not populated`
      return
    }

    this.urls = this.bsFeature.data.urls
      .filter(url => url.indexOf(`_pr_${this.bsLabel}`) >= 0)
      .map(url => {
        return { url }
      })

    const profileBs = this.bsFeature.data._ReceptorDistribution__profiles[this.bsLabel]
    const lineEl = (this.elRef.nativeElement as HTMLElement).querySelector<any>('kg-dataset-dumb-line')
    lineEl.profileBs = profileBs
  }
}
