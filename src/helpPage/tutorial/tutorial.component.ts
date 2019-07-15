import { Component, OnInit } from '@angular/core';
import { IsMobileService } from '../resources/services/is-Movile.service';

@Component({
  selector: 'app-tutorial',
  templateUrl: './tutorial.component.html',
  styleUrls: ['./tutorial.component.css']
})
export class TutorialComponent implements OnInit {

  runGif: string;
  isMobile: boolean;
  constructor(private isMobileService: IsMobileService) { }

  ngOnInit() {
    if (this.isMobileService.isMobile()) {
      this.isMobile = true;
    }
  }

}
