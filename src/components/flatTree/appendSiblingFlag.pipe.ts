import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name : 'appendSiblingFlagPipe',
})

export class AppendSiblingFlagPipe implements PipeTransform {
  public transform(objs: any[]): any[] {
    return objs
      .reduceRight((acc, curr) =>  ({
        acc : acc.acc.concat(Object.assign({}, curr, {
          siblingFlags : curr.lvlId.split('_').map((v, idx) => typeof acc.flags[idx] !== 'undefined'
            ? acc.flags[idx]
            : false)
            .slice(1)
            .map(v => !v),
        })),
        flags: curr.lvlId.split('_').map((_, idx) => acc.flags[idx] ).slice(0, -1).concat(true),
      }), { acc: [], flags : Array(256).fill(false) })
      .acc.reverse()
  }
}
