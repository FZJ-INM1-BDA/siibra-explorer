import { ChangeDetectionStrategy, Component, Input } from "@angular/core";

@Component({
  selector: 'iav-layout-fourcorners',
  templateUrl: './fourCorners.template.html',
  styleUrls: [
    './fourCorners.style.css'
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class FourCornersCmp{
  @Input('iav-layout-fourcorners-cnr-cntr-ngclass')
  cornerContainerClasses = {}
}
