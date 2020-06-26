import { Injectable } from "@angular/core";
import { EnumColorMapName } from "src/util/colorMaps";

@Injectable({
  providedIn: 'root'
})

export class NgLayersService{
  public lowThresholdMap: Map<string, number> = new Map()
  public highThresholdMap: Map<string, number> = new Map()
  public brightnessMap: Map<string, number> = new Map()
  public contrastMap: Map<string, number> = new Map()
  public removeBgMap: Map<string, boolean> = new Map()
  public colorMapMap: Map<string, EnumColorMapName> = new Map()
}
