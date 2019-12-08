# konachan-viewer
Show a popular image from konachan or yande randomly.

## Dependences

### New (using electron):
```
cd new
npm i
```
In case of error:
```
./node_modules/.bin/electron-rebuild
```

### Old (using eel):
 - [eel](https://github.com/samuelhwilliams/Eel)
 - [requests-html](https://github.com/psf/requests-html)
 - [screeninfo](https://github.com/rr-/screeninfo)
 - [Pillow](https://github.com/python-pillow/Pillow)

```
pip install eel requests-html screeninfo Pillow
```

## Usage
 - New
```
cd new
npm start
```
 - Old

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
 - <del>Press `F12` to view history logs </del> (only in `old`)
