import { Injectable } from "@angular/core";

@Injectable({
  providedIn: 'root'
})

export class NgLayersService{
  public lowThresholdMap: Map<string, number> = new Map()
  public highThresholdMap: Map<string, number> = new Map()
  public brightnessMap: Map<string, number> = new Map()
  public contrastMap: Map<string, number> = new Map()
  public removeBgMap: Map<string, boolean> = new Map()
}
