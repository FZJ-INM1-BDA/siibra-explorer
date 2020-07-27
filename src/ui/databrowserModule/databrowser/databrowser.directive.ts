import { Directive } from "@angular/core";
import { DatabrowserBase } from "./databrowser.base";
import { DatabrowserService } from "../singleDataset/singleDataset.base";
import { LoggingService } from "src/logging";

@Directive({
  selector: '[iav-databrowser-directive]',
  exportAs: 'iavDatabrowserDirective'
})

export class DatabrowserDirective extends DatabrowserBase{
  constructor(
    dataService: DatabrowserService,
    log: LoggingService,
  ){
    super(dataService, log)
  }
}
