/* global screen */

// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
const { ipcRenderer } = require('electron')
const request = require('request-promise')
const cheerio = require('cheerio')
const sharp = require('sharp')

const cachedImg = []
const cacheSize = 3
const screenRatio = screen.width / screen.height
const step = 3 * 1000
let lastLoad
const wait = time => new Promise((resolve) => setTimeout(resolve, time))
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

logger('info', 'Preloading...')
logger('info', `cacheSize=${cacheSize}, screen=${screen.width}x${screen.height}, step=${step}.`)

function logger (level, ...sth) {
  ipcRenderer.send('log', level, ...sth)
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
  while (cachedImg.length > cacheSize) await wait(200)
  const site = sites[choice(Object.keys(sites))]
  const d = dateOnly(randomDate(randomDate(site.startDate)))
  const url = `https://${site.url}/post/popular_by_day?day=${d.day}&month=${d.month}&year=${d.year}`
  const options = {
    uri: url,
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
  logger('debug', 'Getting links...')

  await request(options).then($ => {
    $('.directlink.largeimg').each((i, link) => { links.push($(link).attr('href')) })
    $('.directlink.smallimg').each((i, link) => { links.push($(link).attr('href')) })
  }).catch((err) => {
    logger('warning', err)
  })

  await getB64Img(choice(links))

  // if (cachedImg.length > cacheSize) cachedImg.shift()
  getImg()
}

function sizeInRange (ratio, r = 0.45) {
  return (screenRatio * (1 - r) < ratio < screenRatio * (1 + r))
}

function needRotate (ratio) {
  return ((screenRatio >= 1) !== (ratio >= 1))
}

function cache (url, img, info) {
  cachedImg.push({
    url: url,
    img: img,
    info: info
  })
  logger('debug', `Cached. Current length=${cachedImg.length}.`)
  logger('trace', cachedImg)
}

async function getB64Img (link) {
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
  logger('debug', 'Getting image...')

  let ratio, mode, info
  const buffer = await request(options).then(body => Buffer.from(body))
  const image = sharp(buffer)
  const b64Img = await image
    .metadata()
    .then(metadata => {
      info = { ...metadata }
      ratio = metadata.width / metadata.height
      if (needRotate(ratio)) {
        ratio = 1 / ratio
        return image.rotate(choice([90, -90]))
      }
      return image
    })
    .then(img => {
      if (sizeInRange(ratio)) {
        mode = sharp.fit.cover
      } else {
        mode = sharp.fit.contain
      }

      return img.resize({
        width: screen.width,
        height: screen.height,
        fit: mode
      }).webp()
        .toBuffer()
    })
    .then(data => 'data:image;base64,' + data.toString('base64'))

  await cache(link, b64Img, info)
}

async function load () {
  const cached = cachedImg.pop()
  logger('trace', 'Loading: ', cached)

  while (new Date() - lastLoad < step) { await wait(200) }
  document.getElementById('image').src = cached.img
  lastLoad = new Date()
  logger('info', 'URL: ', cached.url)
  logger('info', 'METADATA: ', cached.info)
  load()
}

async function init () {
  logger('info', 'Started.')
  for (let i = 0; i < cacheSize; i++) getImg()
  while (cachedImg.length < 2) await wait(200)
  load()
  ipcRenderer.send('resize', screen.width * 0.75, screen.height * 0.75)
  ipcRenderer.send('fullscreen')
  ipcRenderer.send('show')
}

init()
