import { Pipe } from "@angular/core";

type TTrackBy<T, O> = (input: T) => O

const defaultTrackBy: TTrackBy<unknown, unknown> = i => i

@Pipe({
  name: 'equality',
  pure: true
})

export class EqualityPipe<T>{
  public transform(c1: T, c2: T, trackBy: TTrackBy<T, unknown> = defaultTrackBy): boolean {
    return trackBy(c1) === trackBy(c2)
  }
}
