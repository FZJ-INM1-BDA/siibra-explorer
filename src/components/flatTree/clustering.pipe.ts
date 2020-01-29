import { Pipe, PipeTransform } from "@angular/core";

// TODO deprecate?

@Pipe({
  name : 'clusteringPipe',
})

export class ClusteringPipe implements PipeTransform {
  public transform(array: any[], num: number = 100): any[][] {
    return array.reduce((acc, curr, idx, arr) => idx % num === 0
      ? acc.concat([arr.slice(idx, idx + num)])
      : acc , [])
  }
}
