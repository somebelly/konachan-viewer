# konachan-viewer
Show a popular image from konachan or yande randomly.

## Usage
`new` uses electron. `old` uses Python and eel but seems to be buggy. `new` is recommended.
```
git clone https://github.com/somebelly/konachan-viewer.git
cd konachan-viewer
```
 - New

    ```
    cd new
    npm install
    npm run rebuild
    npm run start
    ```
 - Old

    Dependences:
    [eel](https://github.com/samuelhwilliams/Eel)
    [requests-html](https://github.com/psf/requests-html)
    [screeninfo](https://github.com/rr-/screeninfo)
    [Pillow](https://github.com/python-pillow/Pillow)

    ```
    pip install eel requests-html screeninfo Pillow
    cd old
    python3 konachan-viewer.py
    ```
    (Optional) Add to path (change `knv` to whatever you like):
    ```
    chmod +x konachan-viewer.py
    ln -s konachan-viewer.py <Somewhere in PATH/knv>
    ```

    Then when you want some images:
    ```
    knv
    ```

## Tips
 - Press `F11` to toggle full-screen mode
 - <del>Press `F12` to view history logs </del> (only in `old`)
