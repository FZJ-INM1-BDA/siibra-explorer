import { Component } from '@angular/core'
import { NewestRelease } from '../newestRelease.directive'
import { HttpClient } from '@angular/common/http'
import { map } from 'rxjs/operators'
import { MatDialog } from '@angular/material/dialog'
import { HowToCite } from '../howToCite/howToCite.component'

@Component({
  selector: 'iav-about',
  templateUrl: './about.template.html',
  styleUrls: [
    './about.style.css',
  ],
})

export class AboutCmp extends NewestRelease{
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
  }

  showHowToCite(){
    this.dialog.open(HowToCite)
  }
}
