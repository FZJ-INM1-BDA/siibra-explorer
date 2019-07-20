import { Component, OnInit, Output, EventEmitter } from '@angular/core';


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  @Output() page = new EventEmitter<string>();

  ngOnInit() {
  }

  navigateTo(page) {
    this.page.emit(page);
    if (page) {
      var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?help='+page;
      window.history.pushState({path:newurl},'',newurl);
    }
  }
}
