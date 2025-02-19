import os

spaces = [
    "bigbrain",
    "mni152",
    "colin27",
    "mebrains",
    "waxholm",
    "allen",
]

def main():
    filenames = [f for f in os.listdir(".") if f.endswith(".png")]
    filenames.sort()
    for i, f in enumerate(filenames):
        spc_idx = i // 6
        space = spaces[spc_idx]

        img_idx = i % 6
        axis_idx = img_idx // 2
        
        if axis_idx == 0:
            axis = "coronal"
        elif axis_idx == 1:
            axis = "sagittal"
        elif axis_idx == 2:
            axis = "axial"
        else:
            raise Exception(f"{axis_idx=!r} not found!")
        
        new_name = f"{space}_{axis}_{img_idx % 2}.png"
        os.rename(f, new_name)

if __name__ == "__main__":
    main()
