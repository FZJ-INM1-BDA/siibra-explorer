import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, Inject, Input } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { SapiViewsUtilModule } from "src/atlasComponents/sapiViews";
import { MarkdownModule } from "src/components/markdown";
import { ShareModule } from "src/share";
import { AngularMaterialModule, MAT_DIALOG_DATA } from "src/sharedModules";

export interface DoiData {
  title: string
  actions: string[]
  contributors: string[]
  desc: string
}

@Component({
  selector: 'doi-template',
  templateUrl: './doi.template.html',
  styleUrls: [
    './doi.style.scss'
  ],
  standalone: true,
  imports: [
    MarkdownModule,
    CommonModule,
    AngularMaterialModule,
    ShareModule,
    SapiViewsUtilModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class DoiTemplate {

  data$ = new BehaviorSubject<DoiData>(null)

  @Input('doi-template-data')
  set inputData(data: DoiData){
    this.data$.next(data)
  }

  constructor(@Inject(MAT_DIALOG_DATA) injectedData: DoiData){
    if (injectedData) {
      this.data$.next(injectedData)
    }
  }
}
