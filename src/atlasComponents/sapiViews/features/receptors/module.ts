import { CommonModule } from "@angular/common";
import { APP_INITIALIZER, CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { SpinnerModule } from "src/components/spinner";
import { AngularMaterialModule } from "src/sharedModules";
import { APPEND_SCRIPT_TOKEN } from "src/util/constants";
import { Autoradiography } from "./autoradiography/autoradiography.component";
import { Entry } from "./entry/entry.component";
import { Fingerprint } from "./fingerprint/fingerprint.component"
import { Profile } from "./profile/profile.component"

@NgModule({
  imports: [
    CommonModule,
    AngularMaterialModule,
    FormsModule,
    BrowserAnimationsModule,
    SpinnerModule,
  ],
  declarations: [
    Autoradiography,
    Fingerprint,
    Profile,
    Entry,
  ],
  exports: [
    Autoradiography,
    Fingerprint,
    Profile,
    Entry,
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
  }],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA,
  ]
})

export class ReceptorViewModule{}
