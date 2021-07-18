import { InjectionToken } from "@angular/core";
import { Observable } from "rxjs";

export const VIEWERMODULE_DARKTHEME = new InjectionToken<Observable<boolean>>('VIEWERMODULE_DARKTHEME')
