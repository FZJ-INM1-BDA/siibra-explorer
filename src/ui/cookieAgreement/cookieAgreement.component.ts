import { Component } from '@angular/core'
import { BsModalService } from 'ngx-bootstrap/modal/bs-modal.service';

@Component({
    selector: 'cookie-agreement',
    templateUrl: './cookieAgreement.template.html',
    styleUrls: [
      './cookieAgreement.style.css'
    ]
})
export class CookieAgreement {
  showMore = false;   

  constructor(private modalService: BsModalService,) {}

  AgreeCookies() {
    localStorage.setItem('cookies', 'agreed');
    this.modalService.hide(1);
  }
}