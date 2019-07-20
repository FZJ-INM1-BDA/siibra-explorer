import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-interface',
  templateUrl: './interface.component.html',
  styleUrls: ['./interface.component.css']
})
export class InterfaceComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

  goToRegion(el: HTMLElement) {
    console.log(el);
    el.scrollIntoView({ behavior: "smooth", block: "start" })
  }
}
