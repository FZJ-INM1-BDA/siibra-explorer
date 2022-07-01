import { Component, Inject } from "@angular/core";
import { Observable, Subscription } from "rxjs";
import { distinctUntilChanged } from "rxjs/operators";
import { DARKTHEME } from "src/util/injectionTokens";

const imageDark = 'assets/logo/ebrains-logo-dark.svg'
const imageLight = 'assets/logo/ebrains-logo-light.svg'

@Component({
  selector : 'logo-container',
  templateUrl : './logoContainer.template.html',
  styleUrls : [
    './logoContainer.style.css',
  ],
})

export class LogoContainer {
  // only used to define size
  public imgSrc = imageDark
  
  public containerStyle = {
    backgroundImage: `url('${this.imgSrc}')`
  }

  private subscriptions: Subscription[] = []
  constructor(
    @Inject(DARKTHEME) darktheme$: Observable<boolean>
  ){
    this.subscriptions.push(
      darktheme$.pipe(
        distinctUntilChanged()
      ).subscribe(flag => {
        this.containerStyle = {
          backgroundImage: `url('${flag ? imageLight : imageDark}')`
        }
      })
    )
  }
}
