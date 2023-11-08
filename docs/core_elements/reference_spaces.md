# Multiple reference spaces

siibra supports different parcellation maps for a given reference space, but also different reference coordinate spaces for a given species. The human brain atlas in EBRAINS provides parcellation maps in 

- the MNI 152 space[^1], which is defined by a multi-subject average of structural MRI scans defined at a resolution of about 1mm,

- the freesurfer fsaverage space[^2], which is a pure surface space defined over the vertices of a surface mesh of an average brain,

- the BigBrain histological space[^3] which is the anatomical space of a single subject brain that was 3D reconstructed from more than 7000 histological sections at an isotropic resolution of 20 micrometers.

siibra-explorer is designed visualize any of these different types efficiently, by allowing to zoom into very high resolution images, and by offering both volumetric and surface-based viewing modes.

[^1]: Fonov V, Evans A, McKinstry R, Almli C, Collins D. Unbiased nonlinear average age-appropriate brain templates from birth to adulthood. NeuroImage. 2009;47:S102. doi:10.1016/S1053-8119(09)70884-5. *More precisely, siibra supports the MNI ICBM 152 2009c nonlinear asymmetric template, as well as the Colin 27 single subject average.*

[^2]: Dale AM, Fischl B, Sereno MI. Cortical Surface-Based Analysis: I. Segmentation and Surface Reconstruction. NeuroImage. 1999;9(2):179-194. doi:[10.1006/nimg.1998.0395](https://doi.org/10.1006/nimg.1998.0395)

[^3]: Amunts K, Lepage C, Borgeat L, Mohlberg H, Dickscheid T, Rousseau ME, Bludau S, Bazin PL, Lewis LB, Oros-Peusquens AM, Shah NJ, Lippert T, Zilles K, Evans AC. BigBrain: An Ultrahigh-Resolution 3D Human Brain Model. Science. 2013;340(6139):1472-1475. doi:[10.1126/science.1235381](https://doi.org/10.1126/science.1235381)