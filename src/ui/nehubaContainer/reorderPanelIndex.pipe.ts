import { Pipe, PipeTransform } from "@angular/core";


@Pipe({
  name: 'reorderPanelIndexPipe'
})

export class ReorderPanelIndexPipe implements PipeTransform{
  public transform(panelOrder: string, uncorrectedIndex: number){
    return uncorrectedIndex === null
      ? null
      : panelOrder.indexOf(uncorrectedIndex.toString())
  }
}