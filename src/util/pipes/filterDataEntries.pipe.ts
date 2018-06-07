import { Pipe, PipeTransform } from "@angular/core";
import { DataEntry } from "../../services/stateStore.service";

@Pipe({
  name : 'filterDatasetSearchResult'
})

export class FilterDatasetSearchResult implements PipeTransform{
  public transform(datasets:DataEntry[],filterArr:{name:string,enabled:boolean}[]):DataEntry[]{
    return datasets.filter(dataset=>{
      const filter = filterArr.find(obj=>obj.name == dataset.type)
      return filter ? filter.enabled : false
    })
  }
}