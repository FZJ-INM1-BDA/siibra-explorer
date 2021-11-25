import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: 'groupParcSelected',
  pure: true
})

export class GroupParcSelectedPipe implements PipeTransform{
  public transform(selectedParc: any, parc: any){
    const isSelected = (p: any) => p['@id'] === selectedParc['@id']
    return Array.isArray(parc)
      ? parc.some(isSelected)
      : isSelected(parc)
  }
}
