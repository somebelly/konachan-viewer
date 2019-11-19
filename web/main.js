/* global eel */

eel.expose(loading)
function loading (res) {
  document.getElementById('image').src = './images/' + res[0]
  console.log(res[1])
  return 'I\'m alive'
}
