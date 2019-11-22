/* global eel */

// call: [0]; update: [1, (img, url)]
eel.expose(loading)
function loading (res) {
  if (res[0] === 1) {
    const img = document.getElementById('image')
    img.src = 'data:image;base64,' + res[1][0]
    console.log(res[1][1])
  }
  eel.update_last_call()
}

function updateKeywords (keywords) {
  eel.update_img_keywords(keywords)
}
