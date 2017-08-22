export const TIMEOUT = 5000;
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
                        "_value" : "segment.id"
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


export const PRESET_COLOR_MAPS = [
      {
            name : 'MATLAB_autumn',
            previewurl : "http://172.104.156.15:8080/colormaps/MATLAB_autumn.png",
            code : `
vec4 colormap(float x) {
    float g = clamp(x, 0.0, 1.0);
    return vec4(1.0, g, 0.0, 1.0);
}
            `
      },
       {
            name : 'MATLAB_bone',
            previewurl : 'http://172.104.156.15:8080/colormaps/MATLAB_bone.png',
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
    float r = clamp(colormap_red(x), 0.0, 1.0);
    float g = clamp(colormap_green(x), 0.0, 1.0);
    float b = clamp(colormap_blue(x), 0.0, 1.0);
    return vec4(r, g, b, 1.0);
}
            `
      }
]