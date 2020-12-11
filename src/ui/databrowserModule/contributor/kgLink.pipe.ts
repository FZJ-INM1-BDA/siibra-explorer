import { Pipe, PipeTransform } from "@angular/core";
import { IContributor } from "./util";

@Pipe({
  name: 'getContributorKgLink'
})

export class GetContributorKgLink implements PipeTransform{
  public transform(contributor: IContributor): string{
    const id = contributor['identifier']
    return `https://kg.ebrains.eu/search/instances/Contributor/${id}`
  }
}
