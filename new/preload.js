/* global screen */

// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
const { ipcRenderer } = require('electron')
const request = require('request-promise')
const cheerio = require('cheerio')
const Jimp = require('jimp')
const cachedImg = { url: null, img: null, ratio: null, time: null }
const screenRatio = screen.width / screen.height
const wait = time => new Promise((resolve) => setTimeout(resolve, time))

window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  for (const type of ['chrome', 'node', 'electron']) {
    replaceText(`${type}-version`, process.versions[type])
  }
})

const sites = {
  konachan: {
    url: 'konachan.com',
    startDate: date(2008, 1, 13)
  },

  yande: {
    url: 'yande.re',
    startDate: date(2007, 8, 8)
  }
}

function date (year, month, day) {
  return new Date(year, month - 1, day)
}

function dateOnly (d) {
  return {
    year: d.getFullYear(),
    month: d.getMonth() + 1,
    day: d.getDate()
  }
}

function randomDate (start = new Date() - 1000, end = new Date()) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

function choice (array) { return array[Math.floor(Math.random() * array.length)] }

async function getImg () {
  const site = sites[choice(Object.keys(sites))]
  const d = dateOnly(randomDate(randomDate(site.startDate)))
  const options = {
    uri: `https://${site.url}/post/popular_by_day?day=${d.day}&month=${d.month}&year=${d.year}`,
    headers: {
      accept: '*/*',
      'accept-encoding': 'gzip',
      'accept-language': 'en-US,en;q=0.9,ja-JP;q=0.8,ja;q=0.7,fr-FR;q=0.6,fr;q=0.5,zh-CN;q=0.4,zh;q=0.3',
      'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36'
    },
    gzip: true,
    transform: function (body) {
      return cheerio.load(body)
    }
  }
  const links = []

  await request(options).then($ => {
    $('.directlink.largeimg').each((i, link) => { links.push($(link).attr('href')) })
    $('.directlink.smallimg').each((i, link) => { links.push($(link).attr('href')) })
  })

  await getB64Img(choice(links))
}

function getRatio (image) {
  return image.bitmap.width / image.bitmap.height
}

function sizeInRange (image, r = 0.45) {
  const ratio = getRatio(image)
  return (screenRatio * (1 - r) < ratio < screenRatio * (1 + r))
}

function needRotate (image) {
  const ratio = getRatio(image)
  return ((screenRatio >= 1) !== (ratio >= 1))
}

function cache (url, img, ratio) {
  cachedImg.url = url
  cachedImg.img = img
  cachedImg.ratio = ratio
  // console.log('Cached.')
}

async function getB64Img (link, crop = true) {
  const options = {
    uri: link,
    headers: {
      accept: '*/*',
      'accept-encoding': 'gzip',
      'accept-language': 'en-US,en;q=0.9,ja-JP;q=0.8,ja;q=0.7,fr-FR;q=0.6,fr;q=0.5,zh-CN;q=0.4,zh;q=0.3',
      'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36'
    },
    gzip: true,
    encoding: null
  }

  const buffer = await request(options).then(body => Buffer.from(body))
  const image = await Jimp.read(buffer).then(image => image.autocrop())
  let img
  if (crop) {
    if (needRotate(image)) { image.rotate(choice([90, -90])) }
    if (sizeInRange(image)) { image.cover(screen.width, screen.height) }
    img = await image.getBase64Async(Jimp.AUTO)
  } else {
    img = 'data:image;base64,' + buffer.toString('base64')
  }
  await cache(link, img, getRatio(image))
}

// function isFullScreen () {
//   return (!window.screenTop && !window.screenY) && (window.innerWidth === screen.width && window.innerHeight === screen.height)
// }

async function load () {
  // ipcRenderer.send('global', 'fullscreen', isFullScreen())
  document.getElementById('image').src = cachedImg.img
  cachedImg.time = new Date()
  console.log('URL: ', cachedImg.url)
  // console.log('RATIO: ', cachedImg.ratio)
  await getImg()
  while (new Date() - cachedImg.time < 5000) { await wait(200) }
  load()
}

async function init () {
  await getImg()
  ipcRenderer.send('resize', screen.width * 0.75, screen.height * 0.75)
  ipcRenderer.send('fullscreen')
  ipcRenderer.send('show')
  load()
}

init()
