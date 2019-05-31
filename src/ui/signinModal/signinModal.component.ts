import { Component } from "@angular/core";
import { AuthService, User, AuthMethod } from "src/services/auth.service";

@Component({
  selector: 'signin-modal',
  templateUrl: './signinModal.template.html',
  styleUrls: [
    './signinModal.style.css'
  ]
})

export class SigninModal{
  constructor(
    private authService: AuthService
  ){

  }

  get user() : User | null {
    return this.authService.user
  }
  
  get loginMethods(): AuthMethod[] {
    return this.authService.loginMethods
  }
  
  get logoutHref(): String {
    return this.authService.logoutHref
  }

  loginBtnOnclick() {
    this.authService.authSaveState()
    return true
  }
}