/* global eel */
reload()

window.onbeforeunload = function () { eel.close() }

function loading (img) { document.getElementById('image').src = img }

function reload () { eel.load()(loading) }

window.setInterval(reload, 5000)
