import os
from subprocess import run

flip_idx = {
    "axial": 1,
    "coronal": 1,
    "sagittal": 0,
}

def main():
    for f in os.listdir("."):
        if not f.endswith(".png"):
            continue

        flop_flag = False
        for key in flip_idx:
            if key in f and str(flip_idx[key]) in f:
                flop_flag = True
        run(["convert", f, "-trim", "-shave", "5x5", *(
            ["-flop"] if flop_flag else []
        ), f])

if __name__ == "__main__":
    main()