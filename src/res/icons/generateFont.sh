#! /bin/bash

# [fontforge](https://fontforge.org/en-US/) needs to be installed first

JSON_STRING="$(cat ./meta.json)"

JSON_REMOVE_NL=${JSON_STRING//$'\n'/ }
JSON_REMOVE_WHITESPACE=${JSON_REMOVE_NL//$' '/}

# font = fontforge.font();
# glyph = font.createChar(41, "A");
# glyph.importOutlines("/path/to/svg/foo.svg");
# font.generate("/output/math/foo.ttf");

CSS_MAIN_CLASS='iavic'
CSS_FONT_FILE_NAME='iav-icons'

CSS="
.$CSS_MAIN_CLASS
{
  -moz-osx-font-smoothing: grayscale;
  -webkit-font-smoothing: antialiased;
  display: inline-block;
  font-style: normal;
  font-variant: normal;
  text-rendering: auto;
  line-height: 1;
}

@font-face {
  font-family: "'"'"iav-custom-icons"'"'";
  font-style: normal;
  font-weight: 900;
  font-display:auto;
  src: url(./$CSS_FONT_FILE_NAME.woff) format("'"'"woff"'"'"),url(./$CSS_FONT_FILE_NAME.ttf) format("'"'"truetype"'"'"),url(./$CSS_FONT_FILE_NAME.svg) format("'"'"svg"'"'");
}

.$CSS_MAIN_CLASS
{
  font-family: "'"'"iav-custom-icons"'"'";
}
"

CSS_REMOVE_NL=${CSS//$'\n'/ }
CSS_REMOVE_WHITESPACE=${CSS_REMOVE_NL//$' '/}
CSS_ESCAPE_QUOTES=${CSS_REMOVE_WHITESPACE//\"/\\\"}

FONTFORGE_ARG='
double_quot='"'"'"'"'"'
css_output="'$CSS_ESCAPE_QUOTES'";
css_class="'$CSS_MAIN_CLASS'";
t='$JSON_REMOVE_WHITESPACE';
font = fontforge.font();
for item in t:
  content=item['"'"'content'"'"'];
  _class=item['"'"'class'"'"'];
  svg=item['"'"'svg'"'"'];
  if content is None or len(content) == 0:
    raise Exception("content field must always be defined");
  if svg is None:
    raise Exception("svg path must be defined");
  if _class is None:
    raise Exception("content field must always be defined");
  unicode_coord=ord(content[0]);
  glyph = font.createChar(unicode_coord, content[0]);
  glyph.importOutlines(svg);
  css_output=css_output + "." + css_class + "-" + _class;
  css_output=css_output + ":before{";
  css_output=css_output + "content:" + double_quot + content + double_quot + ";";
  css_output=css_output + "}";

import os;
css_filename="'$CSS_FONT_FILE_NAME'.css"

fd = os.open(css_filename, os.O_RDWR | os.O_CREAT);
os.write(fd, css_output.encode());
os.close(fd);

font.generate("./'$CSS_FONT_FILE_NAME'.ttf");
font.generate("./'$CSS_FONT_FILE_NAME'.woff");
font.generate("./'$CSS_FONT_FILE_NAME'.svg");
'

fontforge -c "$FONTFORGE_ARG"