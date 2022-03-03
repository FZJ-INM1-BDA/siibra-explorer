import { CommonModule } from "@angular/common";
import { APP_INITIALIZER, NgModule } from "@angular/core";
import { APPEND_SCRIPT_TOKEN } from "src/util/constants";
import { Autoradiography } from "./autoradiography/autoradiography.component";
import { Fingerprint } from "./fingerprint/fingerprint.component"
import { Profile } from "./profile/profile.component"

@NgModule({
  imports: [
    CommonModule,
  ],
  declarations: [
    Autoradiography,
    Fingerprint,
    Profile,
  ],
  exports: [
    Autoradiography,
    Fingerprint,
    Profile,
  ],
  providers: [{
    provide: APP_INITIALIZER,
    multi: true,
    useFactory: (appendScriptFn: (url: string) => Promise<any>) => {

      const libraries = [
        'https://cdnjs.cloudflare.com/ajax/libs/d3/6.2.0/d3.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/mathjax/3.1.2/es5/tex-svg.js'
      ]
      return () => Promise.all(libraries.map(appendScriptFn))
    },
    deps: [
      APPEND_SCRIPT_TOKEN
    ]
  }]
})

export class ReceptorViewModule{}
