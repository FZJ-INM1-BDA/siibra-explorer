import { Component } from "@angular/core";

@Component({
  selector: `strict-local-info`,
  template: `
  <button mat-icon-button [matTooltip]="tooltip" tabindex="-1">
    <i class="fas fa-unlink"></i>
  </button>`,
})

export class StrictLocalInfo{
  tooltip = "External links are hidden in strict local mode."
}
