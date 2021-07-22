import { InjectionToken } from "@angular/core";
import { Observable } from "rxjs";
export { BS_ENDPOINT } from 'src/util/constants'

export const BS_DARKTHEME = new InjectionToken<Observable<boolean>>('BS_DARKTHEME')
export const REGISTERED_FEATURE_INJECT_DATA = new InjectionToken('REGISTERED_FEATURE_INJECT_DATA')
