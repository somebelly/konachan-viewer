/* global eel */

reload()

window.onbeforeunload = function () { eel.close() }

// res = [img, url]
function loading (res) {
  document.getElementById('image').src = res[0]
  console.log(res[1])
}

function reload () { eel.load()(loading) }

window.setInterval(reload, 5000)
