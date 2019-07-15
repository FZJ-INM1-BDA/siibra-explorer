import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { IsMobileService } from '../resources/services/is-Movile.service';

@Component({
  selector: 'app-nav-menu',
  templateUrl: './nav-menu.component.html',
  styleUrls: ['./nav-menu.component.css']
})
export class NavMenuComponent implements OnInit {

  isMobile: boolean;

  constructor(private isMobileService: IsMobileService) { }

  @Output() page = new EventEmitter<string>();

  ngOnInit() {
    if (this.isMobileService.isMobile()) {
      this.isMobile = true;
    }
  }

  navigateTo(page) {
    this.page.emit(page);
    if (page){
      var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?help='+page;
      window.history.pushState({path:newurl},'',newurl);
    }
  }

  widthLess() {
    return window.innerWidth >= 750
  }


}
