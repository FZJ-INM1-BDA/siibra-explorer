import { Component } from "@angular/core";
import { AuthService, IAuthMethod, IUser } from "src/services/auth.service";

@Component({
  selector: 'signin-modal',
  templateUrl: './signinModal.template.html',
  styleUrls: [
    './signinModal.style.css',
  ],
})

export class SigninModal {
  constructor(
    private authService: AuthService,
  ) {

  }

  get user(): IUser | null {
    return this.authService.user
  }

  get loginMethods(): IAuthMethod[] {
    return this.authService.loginMethods
  }

  get logoutHref(): string {
    return this.authService.logoutHref
  }

  public loginBtnOnclick() {
    this.authService.authSaveState()
    return true
  }
}
