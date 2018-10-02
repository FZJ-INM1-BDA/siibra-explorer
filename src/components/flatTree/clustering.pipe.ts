import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name : 'clusteringPipe'
})

export class ClusteringPipe implements PipeTransform{
  public transform(arr:any[],num:number = 100):any[][]{
    return arr.reduce((acc,curr,idx,arr) => idx % num === 0 
      ? acc.concat([arr.slice(idx, idx + num)])
      : acc ,[])
  }
}