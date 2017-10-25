export const TIMEOUT = 5000;
export const CM_THRESHOLD = 0.01;
export const CM_MATLAB_HOT = `float r=clamp(8.0/3.0*x,0.0,1.0);float g=clamp(8.0/3.0*x-1.0,0.0,1.0);float b=clamp(4.0*x-3.0,0.0,1.0);`

export const CM_JUBRAIN = `vec3 colormap(float label){float esp=0.01;if(abs(label-1.)<esp){red :,205   ,green:,lueblue: :0    ,blue:0.);if(abs(label-2.)<esp){red :,221  ,green:,ueblue: :160 ,blue:221.);if(abs(label-3.)<esp){red : 0,  ,green:,eblue: :0    ,blue:255.);if(abs(label-4.)<esp){red : 0, ,green: :,lue: 255 ,blue:127.);if(abs(label-5.)<esp){red :,176 ,green:,eblue: :224    ,blue:230.);if(abs(label-6.)<esp){red : 54,,green: :,lue: 255    ,blue:240.);if(abs(label-7.)<esp){red : 17,,green: :,lue: 250    ,blue:140.);if(abs(label-9.)<esp){red :,250    ,green:,blueblue: :128   ,blue:114.);if(abs(label-10.)<esp){red :,255  ,green:,ueblue: :153 ,blue:0.);if(abs(label-11.)<esp){red : 0,   ,green:,ueblue: :50    ,blue:150.);if(abs(label-12.)<esp){red :,205   ,green:,lueblue: :0    ,blue:0.);if(abs(label-13.)<esp){red :,175 ,green:,eblue: :238    ,blue:238.);if(abs(label-14.)<esp){red :,255   ,green:,lueblue: :200  ,blue:100.);if(abs(label-15.)<esp){red : 0,  ,green:,eblue: :147  ,blue:209.);if(abs(label-16.)<esp){red :,144 ,green:,eblue: :238    ,blue:144.);if(abs(label-17.)<esp){red :,210   ,green:,lueblue: :180  ,blue:140.);if(abs(label-18.)<esp){red :,238 ,green:,eblue: :238    ,blue:14.);if(abs(label-19.)<esp){red :,255    ,green:,blueblue: :255   ,blue:0.);if(abs(label-20.)<esp){red : 85,,green: :,lue: 107    ,blue:47.);if(abs(label-21.)<esp){red : 51,,green: :,lue: 0  ,blue:102.);if(abs(label-23.)<esp){red :,239 ,green:,eblue: :134    ,blue:0.);if(abs(label-25.)<esp){red :,255 ,green:,eblue: :200    ,blue:100.);if(abs(label-27.)<esp){red :,42    ,green:,lueblue: :60    ,blue:252.);if(abs(label-28.)<esp){red :,255   ,green:,lueblue: :239  ,blue:213.);if(abs(label-29.)<esp){red :,34  ,green:,eblue: :200 ,blue:100.);if(abs(label-30.)<esp){red :,255    ,green:,blueblue: :200   ,blue:100.);if(abs(label-31.)<esp){red : 0,   ,green:,ueblue: :100   ,blue:209.);if(abs(label-32.)<esp){red :,255  ,green:,ueblue: :204 ,blue:204.);if(abs(label-33.)<esp){red :,153    ,green:,blueblue: :204   ,blue:0.);if(abs(label-34.)<esp){red :,144    ,green:,blueblue: :238   ,blue:144.);if(abs(label-37.)<esp){red :,238  ,green:,ueblue: :232 ,blue:170.);if(abs(label-38.)<esp){red :,255    ,green:,blueblue: :165   ,blue:0.);if(abs(label-39.)<esp){red : 36,,green: :,lue: 157    ,blue:120.);if(abs(label-40.)<esp){red :,205   ,green:,lueblue: :133  ,blue:63.);if(abs(label-42.)<esp){red :,175  ,green:,ueblue: :238 ,blue:238.);if(abs(label-43.)<esp){red :,152    ,green:,blueblue: :251   ,blue:152.);if(abs(label-44.)<esp){red :,204  ,green:,ueblue: :255 ,blue:102.);if(abs(label-45.)<esp){red : 34,,green: :,lue: 200    ,blue:240.);if(abs(label-46.)<esp){red : 0 ,blue:,reen: 209,   blue: ,blue:56.);if(abs(label-47.)<esp){red :,255    ,green:,blueblue: :200   ,blue:100.);if(abs(label-48.)<esp){red :,255  ,green:,ueblue: :255 ,blue:51.);if(abs(label-50.)<esp){red :,205 ,green:,eblue: :0  ,blue:0.);if(abs(label-52.)<esp){red :,231   ,green:,lueblue: :120  ,blue:23.);if(abs(label-55.)<esp){red :,218  ,green:,ueblue: :112 ,blue:214.);if(abs(label-56.)<esp){red : 17,,green: :,lue: 250    ,blue:140.);if(abs(label-59.)<esp){red :,139   ,green:,lueblue: :71   ,blue:137.);if(abs(label-60.)<esp){red :,102  ,green:,ueblue: :0   ,blue:102.);if(abs(label-63.)<esp){red :,42   ,green:,ueblue: :60   ,blue:252.);if(abs(label-64.)<esp){red :,255  ,green:,ueblue: :218 ,blue:185.);if(abs(label-65.)<esp){red : 5, ,green: :,lue: 198 ,blue:198.);if(abs(label-66.)<esp){red :,204    ,green:,blueblue: :51    ,blue:0.);if(abs(label-67.)<esp){red :,216 ,green:,eblue: :150    ,blue:240.);if(abs(label-71.)<esp){red : 0 ,blue:,reen: 146,   blue: ,blue:63.);if(abs(label-73.)<esp){red :,132    ,green:,blueblue: :194   ,blue:37.);if(abs(label-76.)<esp){red :,117   ,green:,lueblue: :197  ,blue:240.);if(abs(label-77.)<esp){red : 0,  ,green:,eblue: :147  ,blue:209.);if(abs(label-80.)<esp){red : 0,  ,green:,eblue: :0    ,blue:153.);if(abs(label-81.)<esp){red :,148   ,green:,lueblue: :0    ,blue:211.);if(abs(label-83.)<esp){red :,153   ,green:,lueblue: :153  ,blue:255.);if(abs(label-84.)<esp){red : 0,  ,green:,eblue: :209  ,blue:56.);if(abs(label-86.)<esp){red :,255  ,green:,ueblue: :192 ,blue:203.);if(abs(label-87.)<esp){red :,176    ,green:,blueblue: :196   ,blue:222.);if(abs(label-88.)<esp){red :,216  ,green:,ueblue: :191 ,blue:216.);if(abs(label-89.)<esp){red :,255    ,green:,blueblue: :0 ,blue:51.);if(abs(label-90.)<esp){red :,144 ,green:,eblue: :238    ,blue:144.);if(abs(label-91.)<esp){red :,255   ,green:,lueblue: :69   ,blue:0.);if(abs(label-92.)<esp){red : 19,,green: :,lue: 255    ,blue:80.);if(abs(label-93.)<esp){red : 0, ,green: :,lue: 255 ,blue:0.);if(abs(label-94.)<esp){red :,255  ,green:,ueblue: :10  ,blue:10.);if(abs(label-96.)<esp){red :,250  ,green:,ueblue: :30  ,blue:250.);if(abs(label-97.)<esp){red :,19  ,green:,eblue: :255 ,blue:120.);if(abs(label-98.)<esp){red :,155    ,green:,blueblue: :100   ,blue:250.);if(abs(label-99.)<esp){red :,205  ,green:,ueblue: :0   ,blue:0.);if(abs(label-100<)esp.){red :,255   ,green:,lueblue: :20   ,blue:147.);{red :,255    ,green:,blueblue: :255   ,blue:255.);}void main(){emitRGB(colormap(label).);}`

export const CM_DEFAULT_MAP = new Map([
    [ 0,  {red : 255,    green: 255,    blue: 255.}  ],
    [ 1,  {red : 205,    green: 0,      blue: 0.}    ],
    [ 2,  {red : 221,    green: 160,    blue: 221.}  ],
    [ 3,  {red : 0,      green: 0,      blue: 255.}  ],
    [ 4,  {red : 0,      green: 255,    blue: 127.}  ],
    [ 5,  {red : 176,    green: 224,    blue: 230.}  ],
    [ 6,  {red : 54,     green: 255,    blue: 240.}  ],
    [ 7,  {red : 17,     green: 250,    blue: 140.}  ],
    [ 9,  {red : 250,    green: 128,    blue: 114.}  ],
    [ 10, {red : 255,    green: 153,    blue: 0.}    ],
    [ 11, {red : 0,      green: 50,     blue: 150.}  ],
    [ 12, {red : 205,    green: 0,      blue: 0.}    ],
    [ 13, {red : 175,    green: 238,    blue: 238.}  ],
    [ 14, {red : 255,    green: 200,    blue: 100.}  ],
    [ 15, {red : 0,      green: 147,    blue: 209.}  ],
    [ 16, {red : 144,    green: 238,    blue: 144.}  ],
    [ 17, {red : 210,    green: 180,    blue: 140.}  ],
    [ 18, {red : 238,    green: 238,    blue: 14.}   ],
    [ 19, {red : 255,    green: 255,    blue: 0.}    ],
    [ 20, {red : 85,     green: 107,    blue: 47.}   ],
    [ 21, {red : 51,     green: 0,      blue: 102.}  ],
    [ 23, {red : 239,    green: 134,    blue: 0.}    ],
    [ 25, {red : 255,    green: 200,    blue: 100.}  ],
    [ 27, {red : 42,     green: 60,     blue: 252.}  ],
    [ 28, {red : 255,    green: 239,    blue: 213.}  ],
    [ 29, {red : 34,     green: 200,    blue: 100.}  ],
    [ 30, {red : 255,    green: 200,    blue: 100.}  ],
    [ 31, {red : 0,      green: 100,    blue: 209.}  ],
    [ 32, {red : 255,    green: 204,    blue: 204.}  ],
    [ 33, {red : 153,    green: 204,    blue: 0.}    ],
    [ 34, {red : 144,    green: 238,    blue: 144.}  ],
    [ 37, {red : 238,    green: 232,    blue: 170.}  ],
    [ 38, {red : 255,    green: 165,    blue: 0.}    ],
    [ 39, {red : 36,     green: 157,    blue: 120.}  ],
    [ 40, {red : 205,    green: 133,    blue: 63.}   ],
    [ 42, {red : 175,    green: 238,    blue: 238.}  ],
    [ 43, {red : 152,    green: 251,    blue: 152.}  ],
    [ 44, {red : 204,    green: 255,    blue: 102.}  ],
    [ 45, {red : 34,     green: 200,    blue: 240.}  ],
    [ 46, {red : 0,      green: 209,    blue: 56.}   ],
    [ 47, {red : 255,    green: 200,    blue: 100.}  ],
    [ 48, {red : 255,    green: 255,    blue: 51.}   ],
    [ 50, {red : 205,    green: 0,      blue: 0.}    ],
    [ 52, {red : 231,    green: 120,    blue: 23.}   ],
    [ 55, {red : 218,    green: 112,    blue: 214.}  ],
    [ 56, {red : 17,     green: 250,    blue: 140.}  ],
    [ 59, {red : 139,    green: 71,     blue: 137.}  ],
    [ 60, {red : 102,    green: 0,      blue: 102.}  ],
    [ 63, {red : 42,     green: 60,     blue: 252.}  ],
    [ 64, {red : 255,    green: 218,    blue: 185.}  ],
    [ 65, {red : 5,      green: 198,    blue: 198.}  ],
    [ 66, {red : 204,    green: 51,     blue: 0.}    ],
    [ 67, {red : 216,    green: 150,    blue: 240.}  ],
    [ 71, {red : 0,      green: 146,    blue: 63.}   ],
    [ 73, {red : 132,    green: 194,    blue: 37.}   ],
    [ 76, {red : 117,    green: 197,    blue: 240.}  ],
    [ 77, {red : 0,      green: 147,    blue: 209.}  ],
    [ 80, {red : 0,      green: 0,      blue: 153.}  ],
    [ 81, {red : 148,    green: 0,      blue: 211.}  ],
    [ 83, {red : 153,    green: 153,    blue: 255.}  ],
    [ 84, {red : 0,      green: 209,    blue: 56.}   ],
    [ 86, {red : 255,    green: 192,    blue: 203.}  ],
    [ 87, {red : 176,    green: 196,    blue: 222.}  ],
    [ 88, {red : 216,    green: 191,    blue: 216.}  ],
    [ 89, {red : 255,    green: 0,      blue: 51.}   ],
    [ 90, {red : 144,    green: 238,    blue: 144.}  ],
    [ 91, {red : 255,    green: 69,     blue: 0.}    ],
    [ 92, {red : 19,     green: 255,    blue: 80.}   ],
    [ 93, {red : 0,      green: 255,    blue: 0.}    ],
    [ 94, {red : 255,    green: 10,     blue: 10.}   ],
    [ 96, {red : 250,    green: 30,     blue: 250.}  ],
    [ 97, {red : 19,     green: 255,    blue: 120.}  ],
    [ 98, {red : 155,    green: 100,    blue: 250.}  ],
    [ 99, {red : 205,    green: 0,      blue: 0.}    ],
    [ 100,{red : 255,    green: 20,     blue: 147.}  ]
])

export const DISCO_WIDGET = {
      title : "Disco Widget",
      body : [
            "This is a test widget. The purpose of this widget is to test the capabilities of Widget Engine(?)",
            {
                  "Hover Segment ID" : {
                        "_activeCell" : true,
                        "_elementTagName" : "span",
                        "_class" : "text-primary bg-primary",
                        "_id" : "UniqueID",
                        "_active" : "toggle",
                        "_hook" : "segmentOnHover",
                        "_value" : "{{segment.id}}",
                        "_action" : {
                              
                        }
                  }
            }
      ]
}

export const COLORMAP_WIDGET = {
      title : "Choose a preset color map",
      body : [
            "{{input.layername}}",
            {
                  "_activeCell" : true,
                  "_bootstrapElement" : "dropdown" 
            }
      ]
}

export const JUGEX_WIDGET = {
    title : 'JuGeX',
    body : [
        {
            "Area1" : {
                "_activeCell" : true,
                "_elementTagName" : "div",
                "_class" : "col-md-12",
                "_id" : "area1",
                "_active":"toggle",
                "_value" : "select a region"
            },
            "Area2" : {
                "_activeCell" : true,
                "_elementTagName" : "div",
                "_class" : "col-md-12",
                "_id" : "area2",
                "_active":"toggle",
                "_value" : "select a region"
            },
        },
        "Select genes of interest:",
        {
            "_activeCell" : true,
            "_elementTagName" : "input",
            "_class" : "form-control",
            "_id" : "genesOfInterest",
            "_attributes" : {
                "placeholder" : "Enter a list of genes of interest"
            }
        },
        {
            "_activeCell" : true,
            "_elementTagName" : "div",
            "_class" : "btn btn-default",
            "_id" : "addRegionsOfInterest",
            "_active":"click",
            "_value" : "Add"
        },{
            "_activeCell" : true,
            "_elementTagName" : "hr",
            "_class" : "col-md-12",
        },{
            "_activeCell" : true,
            "_elementTagName" : "div",
            "_class" : "col-md-12 btn btn-default",
            "_id" : "submit",
            "_active":"click",
            "_value" : "Submit"
        }
    ]
}

export const PRESET_COLOR_MAPS = [
      {
            name : 'MATLAB_autumn',
            previewurl : "http://http://172.104.156.15:8080/colormaps/MATLAB_autumn.png",
            code : `
vec4 colormap(float x) {
    float g = clamp(x,0.0,1.0);
    return vec4(1.0,g,0.0,1.0);
}
            `
      },
       {
            name : 'MATLAB_bone',
            previewurl : 'http://http://172.104.156.15:8080/colormaps/MATLAB_bone.png',
            code : `
float colormap_red(float x) {
    if (x < 0.75) {
        return 8.0 / 9.0 * x - (13.0 + 8.0 / 9.0) / 1000.0;
    } else {
        return (13.0 + 8.0 / 9.0) / 10.0 * x - (3.0 + 8.0 / 9.0) / 10.0;
    }
}

float colormap_green(float x) {
    if (x <= 0.375) {
        return 8.0 / 9.0 * x - (13.0 + 8.0 / 9.0) / 1000.0;
    } else if (x <= 0.75) {
        return (1.0 + 2.0 / 9.0) * x - (13.0 + 8.0 / 9.0) / 100.0;
    } else {
        return 8.0 / 9.0 * x + 1.0 / 9.0;
    }
}

float colormap_blue(float x) {
    if (x <= 0.375) {
        return (1.0 + 2.0 / 9.0) * x - (13.0 + 8.0 / 9.0) / 1000.0;
    } else {
        return 8.0 / 9.0 * x + 1.0 / 9.0;
    }
}

vec4 colormap(float x) {
    float r = clamp(colormap_red(x),0.0,1.0);
    float g = clamp(colormap_green(x), 0.0, 1.0);
    float b = clamp(colormap_blue(x), 0.0, 1.0);
    return vec4(r, g, b, 1.0);
}
            `
      }
]