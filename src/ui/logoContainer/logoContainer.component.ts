import { Component } from "@angular/core";

@Component({
  selector : 'logo-container',
  templateUrl : './logoContainer.template.html',
  styleUrls : [
    './logoContainer.style.css',
  ],
})

export class LogoContainer {
  // only used to define size
  public imgSrc = USE_LOGO === 'hbp'
    ? 'res/image/HBP_Primary_RGB_WhiteText.png'
    : USE_LOGO === 'ebrains'
      ? `res/image/ebrains-logo-light.svg`
      : null

  public useLogo = USE_LOGO
}
