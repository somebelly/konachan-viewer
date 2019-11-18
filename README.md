# konachan-viewer
Show a popular image from konachan randomly (using eel)

## Dependences

 - [eel](https://github.com/samuelhwilliams/Eel)
 - [requests-html](https://github.com/psf/requests-html)

```
pip install eel requests-html
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
 - Edit `window.setInterval(reload, 5000)` in `web/main.js` to change the refresh rate
