import { Component, Input } from "@angular/core";

@Component({
  selector: 'iav-layout-fourcorners',
  templateUrl: './fourCorners.template.html',
  styleUrls: [
    './fourCorners.style.css'
  ]
})

export class FourCornersCmp{
  @Input('iav-layout-fourcorners-cnr-cntr-ngclass')
  cornerContainerClasses = {}
}
