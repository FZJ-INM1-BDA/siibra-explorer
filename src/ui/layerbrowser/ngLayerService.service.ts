import { Injectable } from "@angular/core";

const setGetShaderFn = (normalizedIncomingColor) => (lowerThreshold, upperThreshold, brightness, contrast, removeBg: boolean) => `
void main() {
  float raw_x = toNormalized(getDataValue());
  float x = (raw_x - ${lowerThreshold.toFixed(5)}) / (${(upperThreshold - lowerThreshold).toFixed(5)}) ${brightness > 0 ? '+' : '-'} ${Math.abs(brightness).toFixed(5)};

  ${ removeBg ? 'if(x>1.0){ emitTransparent(); }else if (x<0.0){ emitTransparent(); }else{' : '' }
  
    emitRGB(vec3(
      x * ${normalizedIncomingColor[0].toFixed(5)}, x * ${normalizedIncomingColor[1].toFixed(5)}, x * ${normalizedIncomingColor[2].toFixed(5)})
      * exp(${contrast.toFixed(5)})
    );

  ${ removeBg ? '}' : '' }
  
}
`

@Injectable({
  providedIn: 'root'
})

export class NgLayersService{
  public lowThresholdMap: Map<string, number> = new Map()
  public highThresholdMap: Map<string, number> = new Map()
  public brightnessMap: Map<string, number> = new Map()
  public contrastMap: Map<string, number> = new Map()
  public removeBgMap: Map<string, boolean> = new Map()
  public getShader: (low: number, high: number, brightness: number, contrast: number, removeBg: boolean) => string = setGetShaderFn([1, 1, 1])
}
