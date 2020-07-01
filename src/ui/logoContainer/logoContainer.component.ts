import { Component } from "@angular/core";
import { BACKENDURL } from "src/util/constants";
import { PureContantService } from "src/util";
import { Subscription } from "rxjs";

@Component({
  selector : 'logo-container',
  templateUrl : './logoContainer.template.html',
  styleUrls : [
    './logoContainer.style.css',
  ],
})

export class LogoContainer {
  // only used to define size
  public imgSrc = `${BACKENDURL}logo`
  
  public containerStyle = {
    backgroundImage: `url('${BACKENDURL}logo')`
  }

  private subscriptions: Subscription[] = []
  constructor(
    pureConstantService: PureContantService
  ){
    this.subscriptions.push(
      pureConstantService.darktheme$.subscribe(flag => {
        this.containerStyle = {
          backgroundImage: `url('${BACKENDURL}logo${!!flag ? '?darktheme=true' : ''}')`
        }
      })
    )
  }
}
