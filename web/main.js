/* global eel */

// call: [0]; update: [1, img, url]
eel.expose(loading)
function loading (res) {
  if (res[0] === 1) {
    document.getElementById('image').src = 'data:image;base64,' + res[1]
    console.log(res[2])
  }
  eel.update_last_call()
}
