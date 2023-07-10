# gds_viewer

Based on https://github.com/mbalestrini/tinytapeout_gds_viewer.

## Test

```
git clone https://github.com/mbalestrini/GDS2glTF
python -m pip install -r GDS2glTF/requirements.txt
python GDS2glTF/gds2gltf.py layout.gds
npm install
npx vite
google-chrome http://localhost:5173/
```

## Build viewer

```
npm install
npx vite build
google-chrome dist/index.html
```

## Build standalone viewer with embedded GDS

```
npm install
VITE_GDS_LAYOUT_EMBED=1 npx vite build
google-chrome dist/index.html
```
