import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: 'nmToMm',
  pure: true
})

export class NmToMm implements PipeTransform{
  public transform(nums: number[]): number[] {
    return nums.map(num => (num / 1e6))
  }
}
