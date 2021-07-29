import { Pipe, PipeTransform } from "@angular/core";

interface ITransformedObj{
  key: string
  value: string
}

@Pipe({
  name: 'objToArray',
  pure: true
})

export class ObjectToArrayPipe implements PipeTransform{
  public transform(input: { [key: string]: any }): ITransformedObj[]{
    return Object.keys(input).map(key => {
      return {
        key,
        value: input[key]
      }
    })
  }
}