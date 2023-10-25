import { ChangeDetectionStrategy, Component } from '@angular/core'
import { NewestRelease } from '../newestRelease.directive'
import { HttpClient } from '@angular/common/http'
import { map } from 'rxjs/operators'
import { MatDialog } from 'src/sharedModules/angularMaterial.exports'
import { HowToCite } from '../howToCite/howToCite.component'
import { SAPI, EXPECTED_SIIBRA_API_VERSION } from "src/atlasComponents/sapi/sapi.service"
import { environment } from "src/environments/environment"

@Component({
  selector: 'iav-about',
  templateUrl: './about.template.html',
  styleUrls: [
    './about.style.css',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class AboutCmp extends NewestRelease{
  public versionString: string

  public supportEmailAddress: string = `support@ebrains.eu`
  public contactEmailHref: string = `mailto:${this.supportEmailAddress}?Subject=[siibra-explorer]%20Queries`

  public userDoc = `https://siibra-explorer.readthedocs.io/en/latest/`
  public repoUrl = `https://github.com/FZJ-INM1-BDA/siibra-explorer`

  public newestTag$ = this.newestRelease$.pipe(
    map(v => v.tag_name)
  )

  public newestReleaseNotesUrl$ = this.newestTag$.pipe(
    map(tagname => `https://siibra-explorer.readthedocs.io/en/latest/releases/${tagname}/`)
  )

  constructor(http: HttpClient, private dialog: MatDialog){
    super(http)
    this.versionString = `${environment.VERSION}-${environment.GIT_HASH}:${EXPECTED_SIIBRA_API_VERSION}:${SAPI.API_VERSION}`
  }

  showHowToCite(){
    this.dialog.open(HowToCite)
  }
}
