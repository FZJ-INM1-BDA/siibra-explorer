import { Pipe, PipeTransform } from "@angular/core"
import { PathReturn } from "src/atlasComponents/sapi/typeV3"
import { KeyValue } from "@angular/common"

type DS = KeyValue<string, PathReturn<"/feature/_types">["items"]>

@Pipe({
    name: 'isConnectivity',
    pure: true
})
export class ExcludeConnectivityPipe implements PipeTransform {

    public transform(datasets: DS[], filterForConnectivityFlag: boolean): DS[] {
        return (datasets || []).filter(d => (d.key === 'connectivity') === filterForConnectivityFlag)
    }
}
