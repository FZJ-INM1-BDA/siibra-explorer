import { Component, HostListener } from '@angular/core';
import { ActivatedRoute } from "@angular/router";

@Component({
  selector: 'help-page',
  templateUrl: './helpPage.template.html',
  styles: ['.helpBody {height:100%; overflow-y: scroll !important;}' ]
})
export class HelpPageComponent {

  pages: string[] = ['interface', 'tutorial', 'api']
  activePage: string = ''

  constructor(private route: ActivatedRoute) {
    this.route.queryParams.subscribe(params => {
      if (!params['help']) {
        this.activePage = ''
      } else if (params['help'] !== this.activePage) {
        if (!this.pages.includes(params['help'])) {
          this.activePage = ''
        } else {
          this.activePage = params['help']
        }
      }
    });
  }

  @HostListener('window:popstate', ['$event'])
  onPopState(event) {
    console.log(event)
    if (!window.location.pathname || window.location.pathname === '/help') {
      this.activePage = ''
    }
  }

  pageChanged(event) {
    if (event === '') {
      var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname;
      window.history.pushState({path:newurl},'',newurl);
      this.activePage = event;
    } else this.activePage = event;
  }



}
