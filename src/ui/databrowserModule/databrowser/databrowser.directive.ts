import { Directive, OnDestroy } from "@angular/core";
import { DatabrowserBase } from "./databrowser.base";
import { DatabrowserService } from "../singleDataset/singleDataset.base";
import { LoggingService } from "src/logging";

@Directive({
  selector: '[iav-databrowser-directive]',
  exportAs: 'iavDatabrowserDirective'
})

export class DatabrowserDirective extends DatabrowserBase implements OnDestroy{
  constructor(
    dataService: DatabrowserService,
    log: LoggingService,
  ){
    super(dataService, log)
  }

  ngOnDestroy(){
    super.ngOnDestroy()
  }
}
