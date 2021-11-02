import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: 'combineFn',
  pure: true
})
export class CombineFnPipe implements PipeTransform{
  public transform(fns: CallableFunction[]): CallableFunction{
    return () => {
      for (const fn of fns) fn()
    }
  }
}
