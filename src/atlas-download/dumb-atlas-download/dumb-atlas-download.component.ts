import { ChangeDetectionStrategy, Component } from "@angular/core";
import { DumpDownloadAtlasDownload } from "../dumb-download.directive"

@Component({
  selector: 'dumb-atlas-download',
  templateUrl: './dumb-atlas-download.template.html',
  styleUrls: [
    './dumb-atlas-download.style.scss'
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class DumbAtlasDownload extends DumpDownloadAtlasDownload {

}
