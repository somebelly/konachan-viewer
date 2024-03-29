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
var lastLoad = new Date() - step
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
const keywords = {
  list: [],
  state: false
}

logger('info', 'Preloading...')
logger('info', `cacheSize=${cacheSize}, screen=${screen.width}x${screen.height}, step=${step}.`)

document.addEventListener('keydown', function (event) {
  const input = document.getElementById('keywords')
  if (!keywords.state && event.ctrlKey && event.key === 'f') {
    logger('info', 'Entering keywords...')
    input.style.display = 'block'
    input.focus()
    keywords.state = true
  }
  if (keywords.state && event.key === 'Enter') {
    keywords.list = input.value.replace(',', ' ').replace(';', ' ').split()
    logger('info', `keywords = ${keywords.list}`)
    input.style.display = 'none'
    keywords.state = false
  }
})

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

function filter (links) {
  let res = links
  let temp
  for (let i = 0; i < keywords.list.length; i++) {
    temp = res.filter(link => link.includes(keywords.list[i]))
    if (temp.length > 0) { res = temp } else { break }
  }
  return res
}

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

  request(options)
    .then($ => {
      $('.directlink.largeimg').each((i, link) => { links.push($(link).attr('href')) })
      $('.directlink.smallimg').each((i, link) => { links.push($(link).attr('href')) })
    })
    .then(() => getB64Img(choice(filter(links))))
    .catch((err) => {
      logger('debug', err.message)
      logger('debug', url)
    })

  await wait(step / cacheSize + 1000)
  getImg()
}

function sizeInRange (ratio, r = 0.45) {
  return (screenRatio * (1 - r) < ratio && ratio < screenRatio * (1 + r))
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
  image.metadata()
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
    .then(data => {
      cache(link, 'data:image;base64,' + data.toString('base64'), info)
    })
    .catch((err) => {
      logger('debug', err.message)
      logger('debug', link)
    })
}

async function load () {
  if (cachedImg.length < 1) logger('info', 'Loading...')
  while (cachedImg.length < 1) await wait(200)
  const cached = cachedImg.shift()
  logger('trace', 'Loading: ', cached)

  while (new Date() - lastLoad < step) { await wait(200) }
  document.getElementById('image').src = cached.img
  // document.getElementById('image').style.background = `url(${cached.img})`
  lastLoad = new Date()
  logger('debug', 'URL: ', cached.url)
  logger('debug', 'METADATA: ', cached.info)
  load()
}

async function init () {
  logger('info', 'Started.')
  for (let i = 0; i < cacheSize; i++) getImg()
  load()
  while (cachedImg.length < 1) await wait(200)
  ipcRenderer.send('resize', screen.width * 0.75, screen.height * 0.75)
  ipcRenderer.send('fullscreen')
  ipcRenderer.send('show')
}

init()
