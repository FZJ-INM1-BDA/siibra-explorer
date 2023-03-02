import { Pipe, PipeTransform } from "@angular/core"
import { Input } from "postcss"

@Pipe({
    name: 'isConnectivity',
    pure: true
})
export class ExcludeConnectivityPipe implements PipeTransform {

    public transform(datasets: any[], isConnectivity: boolean): any[] {
        return datasets? isConnectivity? [datasets.find(d => d.key === 'connectivity')]
                           : datasets.filter(d => d.key !== 'connectivity')
                        : null
    }
}
