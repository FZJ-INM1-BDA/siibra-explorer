import { Injectable, OnDestroy } from "@angular/core";
import { Observable, of, Subscription } from "rxjs";
import { HttpClient } from "@angular/common/http";
import { catchError, shareReplay } from "rxjs/operators";

const IV_REDIRECT_TOKEN = `IV_REDIRECT_TOKEN`

@Injectable({
  providedIn: 'root'
})

export class AuthService implements OnDestroy{
  public user: User | null
  public user$: Observable<any>
  public logoutHref: String = 'logout'

  /**
   * TODO build it dynamically, or at least possible to configure via env var
   */
  public loginMethods : AuthMethod[] = [{
    name: 'HBP OIDC',
    href: 'hbp-oidc/auth'
  }]

  constructor(private httpClient: HttpClient) {
    this.user$ = this.httpClient.get('user').pipe(
      catchError(err => {
        return of(null)
      }),
      shareReplay(1)
    )

    this.subscription.push(
      this.user$.subscribe(user => this.user = user)
    )
  }

  private subscription: Subscription[] = []

  ngOnDestroy(){
    while (this.subscription.length > 0) this.subscription.pop().unsubscribe()
  }

  authSaveState() {
    window.localStorage.setItem(IV_REDIRECT_TOKEN, window.location.href)
  }

  authReloadState() {

    const redirect = window.localStorage.getItem(IV_REDIRECT_TOKEN)
    window.localStorage.removeItem(IV_REDIRECT_TOKEN)
    if (redirect) window.location.href = redirect
  }
}

export interface User {
  name: String
  id: String
}

export interface AuthMethod{
  href: String
  name: String
}
