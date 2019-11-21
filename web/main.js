/* global eel */

// res: call: (0, '', ''); update: (1, name, 'url')
eel.expose(loading)
function loading (res) {
  if (res[0] === 1) {
    document.getElementById('image').src = './images/' + res[1]
    console.log(res[2])
  }
  eel.update_last_call()
}
