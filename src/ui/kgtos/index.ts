import { InjectionToken } from "@angular/core";
import { Observable } from "rxjs";

export const TOS_OBS_INJECTION_TOKEN = new InjectionToken<Observable<string>>('TOS_STRING')
