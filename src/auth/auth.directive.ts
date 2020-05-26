import { Directive } from "@angular/core";
import { Observable } from "rxjs";
import { IUser, AuthService } from './auth.service'

@Directive({
  selector: '[iav-auth-authState]',
  exportAs: 'iavAuthAuthState'
})

export class AuthStateDdirective{
  public user$: Observable<IUser>

  constructor(
    private authService: AuthService,
  ){
    this.user$ = this.authService.user$
  }
}
