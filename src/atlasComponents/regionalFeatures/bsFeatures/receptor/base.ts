import { Input } from "@angular/core";
import { TBSResp } from "./type";

export class BsFeatureReceptorBase {
  @Input()
  bsFeature: TBSResp

  public urls: {
    url: string
    text?: string
  }[] = []

  public error = null

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor(){}
}