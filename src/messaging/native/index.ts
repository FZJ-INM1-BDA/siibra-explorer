import { Observable, Subject } from "rxjs"
import { IMessagingActions, IMessagingActionTmpl } from "../types"

export const TYPE = 'iav.unload'

type TUnload = {
  ['@id']: string
}

export const processJsonLd = (json: TUnload): Observable<IMessagingActions<keyof IMessagingActionTmpl>> => {
  const sub = new Subject<IMessagingActions<keyof IMessagingActionTmpl>>()
  const _main = (() => {
    if (!json['@id']) {
      return sub.error(`@id must be defined to `)
    }
    sub.next({
      type: 'unloadResource',
      payload: {
        "@id": json['@id']
      }
    })
    sub.complete()

  })
  setTimeout(_main);
  return sub
}
