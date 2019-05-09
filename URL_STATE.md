
# URL State  


Interactive Atlas Viewer could be run with already selected state. It is possible to create or save application URL so, that it will contain specific data which will usefull to run application with already defined state. In URL, this specific data, is saved as URL query parameters.
  
## URL query parameters in Interactive Atlas Viewer  
  
  
URL query parameters are variables which are located after URL and separated from the URL with "?" mark. URL query parameter variable contains with variable name and value "variable_name=value" Url query parameters are divided by "&" symbol. it is not possible to use whitespaces in the URL query. In Interactive Atlas Viewer, URL query parameters are used to save or create an application state. There are 6 main parameters which are used to save the application state. They are: navigation, niftiLayers, parcellationSelected, pluginState, regionsSelected and templateSelected.  
  
Example of already filled URL looks like this:  
  
```  
  
https://dev-next-interactive-viewer.apps-dev.hbp.eu/?templateSelected=MNI+152+ICBM+2009c+Nonlinear+Asymmetric&parcellationSelected=Fibre+Bundle+Atlas+-+Long+Bundle&navigation=0_0_0_1__0.11092895269393921_0.8756000399589539_-0.44895267486572266_-0.13950254023075104__2500000__1430285_13076858_4495181__204326.41684726204&regionsSelected=31_51_32  
  
```  

4 parameters are mentioned inside the example URL:    

- templateSelected  
- parcellationSelected  
- navigation  
- regionsSelected  
    

### Template Selected - parameter  

Template Selected parameter, is used to save or __select the template__ before we run an application using URL. From the given example we can see the parameter:  
  
```  
templateSelected=MNI+152+ICBM+2009c+Nonlinear+Asymmetric  
```  
  
In parameter value, whitespaces should be replaced with "+" symbol. So, the selected template name actually is:  
  
```  
MNI 152 ICBM 2009c Nonlinear Asymmetric  
```  

To select a template from URL we do not need any other parameter. Parcellation Selected and Navigation parameters will be automatically added by default values. So, before the application automatically adds parameters, the URL will look like that:  
  
```  
https://dev-next-interactive-viewer.apps-dev.hbp.eu/?templateSelected=MNI+152+ICBM+2009c+Nonlinear+Asymmetric  
```  
  
### Parcellation Selected - parameter  

Given parameter is used to select parcellation on the template. As in template selection parameter value, whitespaces are changed with "+" symbol. To use Parcellation parameter, selection template should be in URL parameters too. Navigation parameter will be automatically added by default values. So, before the application automatically adds parameters, the URL will look like this:  
  
```  
https://dev-next-interactive-viewer.apps-dev.hbp.eu/?templateSelected=MNI+152+ICBM+2009c+Nonlinear+Asymmetric&parcellationSelected=Fibre+Bundle+Atlas+-+Long+Bundle  
```  
  
From this example selected parcellation name is  
  

```  
Fibre Bundle Atlas - Long Bundle  
```  
  
### Navigation - parameter  
  
Navigation parameter is to determine orientation, position and zoom of 2d and 3d parts of the selected template. It does not depend on selected parcellation, but it depends on the selected template.  
Navigation parameter itself includes 5 fields - orientation, perspectiveOrientation, perspectiveZoom, position and zoom. They are sorted appropriate and divided by "__" symbol.  
This is the navigation part of the example  
  
```  
navigation=0_0_0_1__0.11092895269393921_0.8756000399589539_-0.44895267486572266_-0.13950254023075104__2500000__1430285_13076858_4495181__204326.41684726204  
```  
  
**orientation** - the field is used to determine an orientation of the 2D part in atlas viewer. The field contains with 4 numbers, divided by "_" symbol. 4 of these numbers should have value "0" and one should have value "1". Value 1 will determine the orientation of the image. In the example orientation is a first element - "0_0_0_1".  
**perspectiveOrientation** - the field is used to determine an orientation of the 3D part in atlas viewer. The field contains with 4 numbers, divided by "_" symbol. In the example perspective orientation is the second element  
  
```  
0.11092895269393921_0.8756000399589539_-0.44895267486572266_-0.13950254023075104"  
```  
  
**perspectiveZoom** - the field is used to determine zoom in 3D pard in atlas viewer. It is the single number and is the third element - "2500000"  
**position** - the field is used to determine the position of the dot where the camera is oriented in both 2D and 3D parts of atlas viewer. Field contains with 3 numbers, divided by "_" symbol - "1430285_13076858_4495181".  
**zoom** - the field is used to determine zoom in 2D pard in atlas viewer. It is the single number and is the last element - "204326.41684726204"  
    

### Regions Selected - parameter  
  
Every region of selected parcellation has its own integer number as id. To select a region from URL, with templateSelected and parcellationSelected parameters, URL should contain the regionSelected parameter. In this parameter. In the given example, we can see the region parameter part.  
  
```  
regionsSelected=31_51_32  
``` 

in parameter, different regions are divided with "_" symbol. It meant that in the given example, there are 3 selected parameters - 31, 51 and 32.  
The region belongs to parcellation, so user can not add regionsSelected without templateSelected and parcellationSelected regions. Navigation parameter will be automatically added by default values.  
  
### Nifti Layers - parameter  

Nifti Layers parameter adds to the application URL when the user selects the nifti layer of selected regions. The value of this parameter is text. Especially, it is a link where the nifti file is located.  
Example  

```  
https://dev-next-interactive-viewer.apps-dev.hbp.eu/?niftiLayers=https%3A%2F%2Fneuroglancer.humanbrainproject.org%2Fprecomputed%2FJuBrain%2Fv2.2c%2FPMaps%2FIPL_PF.nii&templateSelected=MNI+Colin+27&parcellationSelected=JuBrain+Cytoarchitectonic+Atlas  
```  

You see, that value of parameter "niftiLayers" is  

```  
https%3A%2F%2Fneuroglancer.humanbrainproject.org%2Fprecomputed%2FJuBrain%2Fv2.2c%2FPMaps%2FIPL_PF.nii  
```  

This is the encoded text for URL where %3A is for ":" and %2F is for "/". So, nifti file's URL is  

```  
https://Fneuroglancer.humanbrainproject.org/Fprecomputed/JuBrain/v2.2c/PMaps/IPL_PF.nii  
```  
  
## Contributing  
  
Feel free to raise an issue in this repo and/or file a PR.
