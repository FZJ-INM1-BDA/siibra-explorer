export const COLORMAP_IS_DEFAULT = `// iav-colormap-default`

export const COLORMAP_IS_JET = `// iav-colormap-is-jet`

export const COLORMAP_IS_VIRIDIS = `// iav-colormap-is-viridis`
export const COLORMAP_IS_MAGMA = `// iav-colormap-is-magma`
export const COLORMAP_IS_PLASMA = `// iav-colormap-is-plasma`
export const COLORMAP_IS_INFERNO = `// iav-colormap-is-inferno`

export const COLORMAP_IS_GREYSCALE = `// iav-colormap-is-greyscale`

export enum EnumColorMapName{
  JET='jet',
  
  VIRIDIS='viridis',
  PLASMA='plasma',
  MAGMA='magma',
  INFERNO='inferno',

  GREYSCALE='greyscale',

  RGB="rgb (3 channel)"
}

interface IColorMap{
  /**
   * header
   */
  header: string
  /**
   * appended before void main() {} block
   */
  premain: string
  /**
   * appended in void main(){} block
   * 
   * input:
   * 
   * float x;
   * 
   * populate:
   * 
   * vec3 rgb;
   */
  main: string
  override?: () => string
}

export const mapKeyColorMap = new Map<EnumColorMapName, IColorMap>([
  [ EnumColorMapName.JET, {
    header: COLORMAP_IS_JET,
    /**
     *  The MIT License (MIT)

        Copyright (c) 2015 kbinani

        Permission is hereby granted, free of charge, to any person obtaining a copy
        of this software and associated documentation files (the "Software"), to deal
        in the Software without restriction, including without limitation the rights
        to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
        copies of the Software, and to permit persons to whom the Software is
        furnished to do so, subject to the following conditions:

        The above copyright notice and this permission notice shall be included in all
        copies or substantial portions of the Software.

        THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
        IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
        FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
        AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
        LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
        OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
        SOFTWARE.

     * <https://github.com/kbinani/colormap-shaders/blob/master/shaders/glsl/MATLAB_jet.frag>
     */
    premain: `
      float colormap_red(float x) {
        if (x < 0.7) {
          return 4.0 * x - 1.5;
        } else {
          return -4.0 * x + 4.5;
        }
      }
      
      float colormap_green(float x) {
        if (x < 0.5) {
          return 4.0 * x - 0.5;
        } else {
          return -4.0 * x + 3.5;
        }
      }
      
      float colormap_blue(float x) {
        if (x < 0.3) {
          return 4.0 * x + 0.5;
        } else {
          return -4.0 * x + 2.5;
        }
      }
    `,
    main: `
    float r = clamp(colormap_red(x), 0.0, 1.0);
    float g = clamp(colormap_green(x), 0.0, 1.0);
    float b = clamp(colormap_blue(x), 0.0, 1.0);
    rgb=vec3(r,g,b);
    `
  } ],

  [ EnumColorMapName.VIRIDIS, {
    header: COLORMAP_IS_VIRIDIS,
    /**
     * created by mattz CC/0
     * https://www.shadertoy.com/view/WlfXRN
     */
    premain: `
      vec3 viridis(float t) {
      
        const vec3 c0 = vec3(0.2777273272234177, 0.005407344544966578, 0.3340998053353061);
        const vec3 c1 = vec3(0.1050930431085774, 1.404613529898575, 1.384590162594685);
        const vec3 c2 = vec3(-0.3308618287255563, 0.214847559468213, 0.09509516302823659);
        const vec3 c3 = vec3(-4.634230498983486, -5.799100973351585, -19.33244095627987);
        const vec3 c4 = vec3(6.228269936347081, 14.17993336680509, 56.69055260068105);
        const vec3 c5 = vec3(4.776384997670288, -13.74514537774601, -65.35303263337234);
        const vec3 c6 = vec3(-5.435455855934631, 4.645852612178535, 26.3124352495832);
      
        return c0+t*(c1+t*(c2+t*(c3+t*(c4+t*(c5+t*c6)))));
      }
    `,
    main: 'rgb=viridis(x);'
  } ],
  [ EnumColorMapName.PLASMA, {
    header: COLORMAP_IS_PLASMA,
    /**
     * created by mattz CC/0
     * https://www.shadertoy.com/view/WlfXRN
     */
    premain: `
      vec3 plasma(float t) {

        const vec3 c0 = vec3(0.05873234392399702, 0.02333670892565664, 0.5433401826748754);
        const vec3 c1 = vec3(2.176514634195958, 0.2383834171260182, 0.7539604599784036);
        const vec3 c2 = vec3(-2.689460476458034, -7.455851135738909, 3.110799939717086);
        const vec3 c3 = vec3(6.130348345893603, 42.3461881477227, -28.51885465332158);
        const vec3 c4 = vec3(-11.10743619062271, -82.66631109428045, 60.13984767418263);
        const vec3 c5 = vec3(10.02306557647065, 71.41361770095349, -54.07218655560067);
        const vec3 c6 = vec3(-3.658713842777788, -22.93153465461149, 18.19190778539828);
    
        return c0+t*(c1+t*(c2+t*(c3+t*(c4+t*(c5+t*c6)))));
    
      }
    `,
    main: 'rgb=plasma(x);'
  } ],
  [ EnumColorMapName.MAGMA, {
    header: COLORMAP_IS_MAGMA,
    /**
     * created by mattz CC/0
     * https://www.shadertoy.com/view/WlfXRN
     */
    premain: `
      vec3 magma(float t) {
      
          const vec3 c0 = vec3(-0.002136485053939582, -0.000749655052795221, -0.005386127855323933);
          const vec3 c1 = vec3(0.2516605407371642, 0.6775232436837668, 2.494026599312351);
          const vec3 c2 = vec3(8.353717279216625, -3.577719514958484, 0.3144679030132573);
          const vec3 c3 = vec3(-27.66873308576866, 14.26473078096533, -13.64921318813922);
          const vec3 c4 = vec3(52.17613981234068, -27.94360607168351, 12.94416944238394);
          const vec3 c5 = vec3(-50.76852536473588, 29.04658282127291, 4.23415299384598);
          const vec3 c6 = vec3(18.65570506591883, -11.48977351997711, -5.601961508734096);
      
          return c0+t*(c1+t*(c2+t*(c3+t*(c4+t*(c5+t*c6)))));
      
      }
    `,
    main: 'rgb=magma(x);'
  } ],
  [ EnumColorMapName.INFERNO, {
    header: '',
    /**
     * created by mattz CC/0
     * https://www.shadertoy.com/view/WlfXRN
     */
    premain: `
      vec3 inferno(float t) {

        const vec3 c0 = vec3(0.0002189403691192265, 0.001651004631001012, -0.01948089843709184);
        const vec3 c1 = vec3(0.1065134194856116, 0.5639564367884091, 3.932712388889277);
        const vec3 c2 = vec3(11.60249308247187, -3.972853965665698, -15.9423941062914);
        const vec3 c3 = vec3(-41.70399613139459, 17.43639888205313, 44.35414519872813);
        const vec3 c4 = vec3(77.162935699427, -33.40235894210092, -81.80730925738993);
        const vec3 c5 = vec3(-71.31942824499214, 32.62606426397723, 73.20951985803202);
        const vec3 c6 = vec3(25.13112622477341, -12.24266895238567, -23.07032500287172);
    
        return c0+t*(c1+t*(c2+t*(c3+t*(c4+t*(c5+t*c6)))));
    
      }
    `,
    main: 'rgb=inferno(x);'
  } ],

  [ EnumColorMapName.GREYSCALE, {
    header: COLORMAP_IS_GREYSCALE,
    premain: '',
    main: 'rgb=vec3(x, x, x);'
  } ],

  
  [ EnumColorMapName.RGB, {
    header: '',
    main: '',
    premain: '',
    override() {
      const removeBg = false
      const lowThreshold = 0
      const highThreshold = 1
      const contrast = 0
      const brightness = 0
      
      const _lowThreshold = lowThreshold + 1e-10
      const getChan = (variable: string, idx: number) => `float ${variable} = ( toNormalized(getDataValue( ${idx} )) - ${_lowThreshold.toFixed(10)} ) / ( ${ highThreshold - _lowThreshold } ) ${ brightness > 0 ? '+' : '-' } ${Math.abs(brightness).toFixed(10)};`
      return `void main() { ${getChan('r', 0)} ${getChan('g', 1)} ${getChan('b', 2)}
${ removeBg ? 'if (r < 0.01 && g < 0.01 && b < 0.01 ) { emitTransparent(); } else {' : '' }
emitRGB(vec3(r, g, b) * exp(${contrast.toFixed(10)}));
${ removeBg ? '}' : '' }
}`
    }
  } ]
])
