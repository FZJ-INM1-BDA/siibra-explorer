import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: 'numbers',
  pure: true
})

export class NumbersPipe implements PipeTransform{
  public transform(nums: number[], decimal: number = 2): number[] {
    return nums.map(num => num.toFixed(decimal)).map(Number)
  }
}
