// Modules to control application life and create native browser window

const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const logger = { level: 'info' }

logger.log = (level, ...sth) => {
  if (loglevels[level] >= loglevels[logger.level] && loglevels[logger.level] >= 0) {
    const now = new Date()
    const time = { hh: now.getHours(), mm: now.getMinutes(), ss: now.getSeconds() }

    for (const k in time) {
      if (time[k] < 10) {
        time[k] = `0${time[k]}`
      } else {
        time[k] = `${time[k]}`
      }
    }

    const t = `${time.hh}:${time.mm}:${time.ss}`
    console.log(`[${level.toUpperCase()}](${t})\t`, ...sth)
  }
}

const loglevels = {
  quiet: -1,
  trace: 0,
  debug: 1,
  info: 2,
  warning: 3,
  error: 233
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow () {
  logger.log('info', 'Creating mainWindow...')

  // Create the browser window.
  mainWindow = new BrowserWindow({
    show: false,
    frame: false,
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
    logger.log('info', 'MainWindow closed.')
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.commandLine.appendSwitch('disable-http-cache')
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') app.quit()
  logger.log('info', 'Quit.')
})

app.on('activate', function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) createWindow()
  logger.log('info', 'Activating mainWindow...')
})
// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

ipcMain.on('resize', (event, width, height) => {
  mainWindow.setSize(width, height)
  logger.log('info', `Set mainWindow size to ${width}x${height}.`)
})

ipcMain.on('show', (event, args) => {
  mainWindow.show()
  logger.log('info', 'Showing mainWindow...')
})

ipcMain.on('fullscreen', (event, args) => {
  mainWindow.setFullScreen(true)
  logger.log('info', 'Set to fullscreen mode. Press [F11] to toggle.')
})

ipcMain.on('log', (event, level, ...sth) => {
  logger.log(level, ...sth)
})
