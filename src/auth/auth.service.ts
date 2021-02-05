import { HttpClient } from "@angular/common/http";
import { Injectable, OnDestroy } from "@angular/core";
import { Observable, of, Subscription } from "rxjs";
import { catchError, map, shareReplay } from "rxjs/operators";
import { BACKENDURL } from "src/util/constants";

const IV_REDIRECT_TOKEN = `IV_REDIRECT_TOKEN`

export type TUserRouteResp = TUserRoute & TUserRouteError

export type TUserRoute = {
  id: string
}

export type TUserRouteError = {
  error: boolean
  message?: string
}


@Injectable({
  providedIn: 'root',
})

export class AuthService implements OnDestroy {
  public user: IUser | null
  public user$: Observable<any>
  public logoutHref: string = 'logout'

  /**
   * TODO build it dynamically, or at least possible to configure via env var
   */
  public loginMethods: IAuthMethod[] = [{
    name: 'HBP OIDC',
    href: 'hbp-oidc/auth'
  }, {
    name: 'HBP OIDC v2 (beta)',
    href: 'hbp-oidc-v2/auth'
  }]

  constructor(private httpClient: HttpClient) {
    this.user$ = this.httpClient.get<TUserRouteResp>(`${BACKENDURL}user`).pipe(
      map(json => {
        if (json.error) {
          throw new Error(json.message || 'User not loggedin.')
        }
        return json
      }),
      catchError(_err => {
        return of(null)
      }),
      shareReplay(1),
    )

    this.subscription.push(
      this.user$.subscribe(user => this.user = user),
    )
  }

  private subscription: Subscription[] = []

  public ngOnDestroy() {
    while (this.subscription.length > 0) { this.subscription.pop().unsubscribe() }
  }

  public authSaveState() {
    window.localStorage.setItem(IV_REDIRECT_TOKEN, window.location.href)
  }

  public authReloadState() {

    const redirect = window.localStorage.getItem(IV_REDIRECT_TOKEN)
    window.localStorage.removeItem(IV_REDIRECT_TOKEN)
    if (redirect) { window.location.href = redirect }
  }
}

export interface IUser {
  name: string
  id: string
}

export interface IAuthMethod {
  href: string
  name: string
}
