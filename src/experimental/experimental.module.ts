import { DOCUMENT } from "@angular/common";
import { APP_INITIALIZER, InjectionToken, NgModule } from "@angular/core";
import { BehaviorSubject, fromEvent, Observable } from "rxjs";
import { filter, scan, take } from "rxjs/operators";
import { MatSnackBar } from "src/sharedModules";

const CODE_DICT = {
  ArrowUp: "ArrowUp",
  ArrowDown: "ArrowDown",
  ArrowLeft: "ArrowLeft",
  ArrowRight: "ArrowRight",
  b: "b",
  a: "a",
} as const

const CODE = [
  CODE_DICT.ArrowUp,
  CODE_DICT.ArrowUp,
  CODE_DICT.ArrowDown,
  CODE_DICT.ArrowDown,
  CODE_DICT.ArrowLeft,
  CODE_DICT.ArrowRight,
  CODE_DICT.ArrowLeft,
  CODE_DICT.ArrowRight,
  CODE_DICT.b,
  CODE_DICT.a,
]

function isKCode(input: string): input is (keyof typeof CODE_DICT) {
  return input in CODE_DICT
}

function isNextKCode(current: (keyof typeof CODE_DICT)[], input: keyof typeof CODE_DICT): boolean {
  return CODE[current.length] === input
}

export const SHOW_EXPERIMENTAL_TOKEN = new InjectionToken<Observable<boolean>>("SHOW_EXPERIMENTAL_TOKEN")

const showXmptToggle = new BehaviorSubject<boolean>(false)

@NgModule({
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: (document: Document, snackbar: MatSnackBar) => {
        fromEvent(document, "keydown", { capture: true }).pipe(
          scan((acc, curr: KeyboardEvent) => {
            const key = curr.key
            if (!isKCode(key)) {
              return []
            }
            if (!isNextKCode(acc, key)) {
              return []
            }
            return [...acc, key]
          }, [] as (keyof typeof CODE_DICT)[]),
          filter(code => code.length === CODE.length),
          take(1)
        ).subscribe(() => {
          showXmptToggle.next(true)
          snackbar.open(`Cheat mode activated`, "Dismiss", { duration: 5000 })
        })
        return () => Promise.resolve()
      },
      multi: true,
      deps: [DOCUMENT, MatSnackBar]
    },
    {
      provide: SHOW_EXPERIMENTAL_TOKEN,
      useValue: showXmptToggle.asObservable()
    }
  ]
})

export class KCodeModule{}
