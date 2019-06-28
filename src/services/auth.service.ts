import { Injectable } from "@angular/core";
import { AtlasViewerConstantsServices } from "src/atlasViewer/atlasViewer.constantService.service";

const IV_REDIRECT_TOKEN = `IV_REDIRECT_TOKEN`

@Injectable({
  providedIn: 'root'
})

export class AuthService{
  public user: User | null

  public logoutHref: String = 'logout'

  /**
   * TODO build it dynamically, or at least possible to configure via env var
   */
  public loginMethods : AuthMethod[] = [{
    name: 'HBP OIDC',
    href: 'hbp-oidc/auth'
  }]

  constructor(constantService: AtlasViewerConstantsServices) {
    fetch('user', constantService.getFetchOption())
      .then(res => res.json())
      .then(user => this.user = user)
      .catch(e => {
        if (!PRODUCTION)
          console.log(`auth failed`, e)
      })
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
