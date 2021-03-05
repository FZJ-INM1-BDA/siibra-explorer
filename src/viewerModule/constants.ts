import { InjectionToken } from "@angular/core";
import { Observable } from "rxjs";

export type TSupportedViewer = 'nehuba' | 'threeSurfer' | null

export const VIEWERMODULE_DARKTHEME = new InjectionToken<Observable<boolean>>('VIEWERMODULE_DARKTHEME')
