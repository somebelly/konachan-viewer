# konachan-viewer
Show a popular image from konachan or yande randomly (using eel)

## Dependences

 - [eel](https://github.com/samuelhwilliams/Eel)
 - [requests-html](https://github.com/psf/requests-html)
 - [screeninfo](https://github.com/rr-/screeninfo)
 - [Pillow](https://github.com/python-pillow/Pillow)

```
pip install eel requests-html screeninfo Pillow
```

## Usage

Add to path (change `knv` to whatever you like):
```
git clone https://github.com/somebelly/konachan-viewer.git
cd konachan-viewer
chmod +x konachan-viewer.py
ln -s konachan-viewer.py <Somewhere in PATH/knv>
```

Then when you want some images:
```
knv
```

## Tips
 - Press `F11` to enter full-screen mode
 - Press `F12` to view history logs
