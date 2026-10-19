import { Directive, Input } from "@angular/core";
import { BehaviorSubject, combineLatest, concat, defer, from, of, timer } from "rxjs";
import { catchError, map, retryWhen, switchMap } from "rxjs/operators";

type DatumMeta = {
  // TODO type datum
  "https://schema.brainatlas.eu/apps.ebrains.eu/geom-svc/datum": Record<string, string>
  _logpath: string
}

const WF_COMPLETE = "wf:completed"
const DO_NOT_INCLUDE_WF = ["massage_metadata"]

export class MetaError extends Error { }

@Directive({
  selector: '[spatial-option]',
  standalone: true,
  exportAs: 'spatialOpt'
})

export class SpatialOption {

  protected _url$ = new BehaviorSubject<string | null>(null)
  @Input()
  set url(val: string) {
    this._url$.next(val)
  }

  protected getMetaJson() {
    return this._url$.pipe(
      switchMap(url => {
        if (!url) {
          return of(new MetaError('Unknown URL'))
        }
        const trimmedUrl = url.replace(/\/$/, '')

        return defer(() =>
          from(fetch(`${trimmedUrl}/meta.json`).then(res => res.json() as Promise<DatumMeta>))
        ).pipe(
          catchError((err, obs) => timer(5000).pipe(
            switchMap(() => obs)
          ))
        )
      })
    )
  }

  protected metaJson$ = this._url$.pipe(
    switchMap(url => {
      if (!url) {
        return of(new MetaError('Unknown URL'))
      }
      const trimmedUrl = url.replace(/\/$/, '')

      return concat(
        of(null),
        defer(() =>
          from(fetch(`${trimmedUrl}/meta.json`).then(res => res.json() as Promise<DatumMeta>))
        ).pipe(
          catchError((err, obs) => timer(5000).pipe(
            switchMap(() => obs)
          ))
        )

      )
    })
  )

  label$ = concat(
    of('Loading ...'),
    defer(() => this.getMetaJson()).pipe(
      map(meta => {
        if (meta instanceof MetaError) {
          throw meta
        }
        if (!meta) {
          throw new Error(`Not ready`)
        }
        const label = meta?.['https://schema.brainatlas.eu/apps.ebrains.eu/geom-svc/datum']?.['label']
        if (!label) {
          throw new Error(`No label!`)
        }
        return label
      }),
      retryWhen(errs => errs.pipe(switchMap(() => timer(5000)))),
    )
  )

  disabled$ = combineLatest([
    this.metaJson$,
    this._url$,
  ]).pipe(
    switchMap(([meta, url]) => {
      if (meta instanceof MetaError || !meta) {
        return of(true)
      }
      if (!url) {
        return of(true)
      }
      const trimmedUrl = url.replace(/\/$/, '')
      const logpath = meta['_logpath'] || '.ingsvc.log'
      const resIsReady = async () => {
        try {
          const resp = await fetch(`${trimmedUrl}/${logpath}`)
          const text = await resp.text()
          const filteredComplete = text.split("\n").filter(l => !DO_NOT_INCLUDE_WF.some(banned => l.includes(banned)))
          const actualCompleted = filteredComplete.filter(l => l.includes(WF_COMPLETE))
          return actualCompleted.length > 0
        } catch {
          return false
        }
      }
      return concat(
        of(true),
        defer(() => from(resIsReady())).pipe(
          map(ready => {
            if (!ready) throw new Error("not ready")
            return false
          }),
          retryWhen(errs => errs.pipe(switchMap(() => timer(5000)))),
        )

      )
    })
  )
}