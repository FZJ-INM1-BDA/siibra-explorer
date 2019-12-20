import {Pipe, PipeTransform} from "@angular/core";

@Pipe({
    name: 'filterWithString',
})
export class FilterWithStringPipe implements PipeTransform {
    public transform(value: any, ...args): any {
        if (args[0]) {
            return value.filter(pf => pf.name.toLowerCase().includes(args[0].toLowerCase()))
        } else {
            return value
        }
    }
}
